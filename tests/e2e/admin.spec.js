const { test, expect } = require('@playwright/test');

test.describe('管理后台功能测试', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForURL('/');
  });

  test('后台首页统计数据显示', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.locator('text=工具总数')).toBeVisible();
    await expect(page.locator('text=注册用户')).toBeVisible();
    await expect(page.locator('text=借用记录')).toBeVisible();
    await expect(page.locator('text=待处理')).toBeVisible();
  });

  test('工具管理页面功能', async ({ page }) => {
    await page.goto('/admin/tools');
    await expect(page.locator('text=工具管理')).toBeVisible();
    await expect(page.getByRole('button', { name: '新增工具' })).toBeVisible();
  });

  test('借用管理页面功能', async ({ page }) => {
    await page.goto('/admin/borrows');
    await expect(page.locator('text=借用管理')).toBeVisible();
  });

  test('库存日历页面功能', async ({ page }) => {
    await page.goto('/admin/calendar');
    await expect(page.locator('text=库存日历')).toBeVisible();
  });

  test('维修管理页面功能', async ({ page }) => {
    await page.goto('/admin/maintenances');
    await expect(page.locator('text=维修管理')).toBeVisible();
  });

  test('审计日志页面功能', async ({ page }) => {
    await page.goto('/admin/audit');
    await expect(page.locator('text=审计日志')).toBeVisible();
  });

  test('用户管理页面功能', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.locator('text=用户管理')).toBeVisible();
  });
});
