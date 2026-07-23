import { test, expect } from '@playwright/test';

const MANAGER = 'http://localhost:3002';
const CLIENT = 'http://localhost:3001';

// Роут /orders/[id] компилируется dev-сервером по первому обращению, а в полном
// прогоне шесть серверов делают это одновременно. Стандартных 30 с на тест при
// холодном старте не хватает — изолированно те же тесты укладываются в ~3 с.
test.describe.configure({ timeout: 60_000 });

/**
 * Карточка заказа: manager-web (полная) и client-portal (урезанная, BR-32).
 * Данные детерминированы фикстурой, но статус заказа изменяется тестом смены
 * статуса — поэтому каждый тест берёт свой заказ, чтобы не зависеть от порядка.
 *
 *   ord_0001 — cex, queued        → навигация и обзор
 *   ord_0002 — office, in_production → экономика (есть факт)
 *   ord_0004 — cex, ready         → смена статуса
 *   ord_0008 — office, client_approval → согласование макета клиентом
 *   ord_0010 — cex, defect_rework → брак
 */

test('manager-web: из таблицы дашборда открывается карточка заказа', async ({ page }) => {
  await page.goto(MANAGER);
  await expect(page.getByText('Все заказы за сегодня')).toBeVisible({ timeout: 8000 });

  await page.getByRole('link', { name: 'UNI-2026-00001' }).first().click();

  await page.waitForURL(/\/orders\/ord_/);
  await expect(page.getByRole('heading', { name: 'Баннер 3×1 м' })).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Состав заказа')).toBeVisible();
});

test('manager-web: карточка показывает степпер, вкладки и боковую панель', async ({ page }) => {
  await page.goto(`${MANAGER}/orders/ord_0001`);
  await expect(page.getByRole('heading', { name: 'Баннер 3×1 м' })).toBeVisible({ timeout: 8000 });

  // Степпер статус-машины типа cex (BR-07) — «Замер сделан» есть только у цеха
  await expect(page.getByLabel('Этапы заказа')).toBeVisible();
  await expect(page.getByLabel('Этапы заказа').getByText('Замер сделан')).toBeVisible();

  // Боковая панель
  await expect(page.getByText('ООО «Рассвет»').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ответственные' })).toBeVisible();

  // Вкладки
  await page.getByRole('tab', { name: 'Производство' }).click();
  await expect(page.getByText('Маршрут производства')).toBeVisible();

  await page.getByRole('tab', { name: 'Документы' }).click();
  await expect(page.getByText('Счёт на оплату')).toBeVisible();

  await page.getByRole('tab', { name: 'История' }).click();
  await expect(page.getByRole('heading', { name: 'История заказа' })).toBeVisible();
});

test('manager-web: экономика показывает план/факт и маржу (скрыто от клиента, BR-32)', async ({
  page,
}) => {
  await page.goto(`${MANAGER}/orders/ord_0002`);
  await page.getByRole('tab', { name: 'Экономика' }).click();

  await expect(page.getByText('Структура себестоимости')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Маржа', { exact: true })).toBeVisible();
  await expect(page.getByText('Себестоимость факт', { exact: true })).toBeVisible();
  await expect(page.getByText('BR-32').first()).toBeVisible();
});

test('manager-web: смена статуса пишется в историю (BR-20)', async ({ page }) => {
  await page.goto(`${MANAGER}/orders/ord_0004`);
  await expect(page.getByRole('heading', { name: 'Баннер 6×1 м' })).toBeVisible({ timeout: 8000 });

  await page.getByRole('button', { name: 'Сменить статус' }).click();
  // ord_0004 = ready → следующий по маршруту cex — «Выдан»
  await page.getByLabel('Следующий статус').selectOption('delivered');
  await page
    .getByLabel('Комментарий (необязательно)')
    .fill('Курьер передал заказ клиенту, подписан акт');
  await page.getByRole('button', { name: 'Применить' }).click();

  // После применения страница переключается на историю
  await expect(page.getByRole('heading', { name: 'История заказа' })).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Курьер передал заказ клиенту, подписан акт')).toBeVisible();
  // Статус в шапке обновился
  await expect(page.getByText('Выдан').first()).toBeVisible();
});

test('manager-web: брак показан с BR-03 (фиксирует складщик)', async ({ page }) => {
  await page.goto(`${MANAGER}/orders/ord_0010`);
  await page.getByRole('tab', { name: 'Производство' }).click();

  await expect(page.getByText('Зафиксирован брак')).toBeVisible({ timeout: 8000 });
  await expect(page.getByText('Дмитрий Сорокин', { exact: false }).first()).toBeVisible();
  await expect(page.getByText('BR-03').first()).toBeVisible();
});

test('client-portal: карточка заказа без себестоимости и сотрудников (BR-32)', async ({ page }) => {
  await page.goto(`${CLIENT}/orders/ord_0002`);
  await expect(page.getByRole('heading', { name: 'Визитки 200 шт' })).toBeVisible({ timeout: 8000 });

  await expect(page.getByLabel('Ход выполнения заказа')).toBeVisible();
  await expect(page.getByText('Что заказано')).toBeVisible();
  await expect(page.getByText('BR-32').first()).toBeVisible();

  // Внутренних блоков на экране нет. Слово «себестоимость» на странице есть —
  // но только в тексте плашки BR-32, поэтому проверяем именно блоки.
  await expect(page.getByText('Структура себестоимости')).toHaveCount(0);
  await expect(page.getByText('Маршрут производства')).toHaveCount(0);
  await expect(page.getByText('Списанные материалы')).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Экономика' })).toHaveCount(0);
});

test('client-portal: клиент согласовывает макет (BR-11)', async ({ page }) => {
  await page.goto(`${CLIENT}/orders/ord_0008`);
  await expect(page.getByRole('heading', { name: 'Визитки 800 шт' })).toBeVisible({ timeout: 8000 });

  await expect(page.getByText('Ждём вашего решения')).toBeVisible();
  await page.getByRole('button', { name: 'Согласовать макет' }).click();

  await expect(page.getByText('Согласован', { exact: true })).toBeVisible({ timeout: 8000 });
  // Согласование двигает заказ в очередь производства
  await expect(page.getByText('В очереди')).toBeVisible();
});
