const { test, expect } = require('@playwright/test');

test.describe('社区工具借还系统 - 主流程测试', () => {
  
  test('登录页面正常显示', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=登录')).toBeVisible();
    await expect(page.locator('input[name="username"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('居民用户登录并浏览工具', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'resident1');
    await page.fill('input[name="password"]', 'resident123');
    
    await page.getByRole('button', { name: '登录' }).click();
    
    await page.waitForURL('/');
    await expect(page.locator('text=社区工具共享')).toBeVisible();
    
    await page.goto('/tools');
    await expect(page.locator('.tool-card').first()).toBeVisible();
  });

  test('管理员登录并访问后台', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    
    await page.getByRole('button', { name: '登录' }).click();
    
    await page.waitForURL('/');
    
    await page.goto('/admin');
    await expect(page.locator('text=数据概览')).toBeVisible();
    await expect(page.locator('text=工具总数')).toBeVisible();
    await expect(page.locator('text=借用管理')).toBeVisible();
  });

  test('志愿者审核借用申请', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'volunteer');
    await page.fill('input[name="password"]', 'volunteer123');
    
    await page.getByRole('button', { name: '登录' }).click();
    
    await page.goto('/admin/borrows');
    await expect(page.locator('text=借用管理')).toBeVisible();
  });

  test('工具详情页面显示正确信息', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'resident1');
    await page.fill('input[name="password"]', 'resident123');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForURL('/');
    
    await page.goto('/tools');
    
    const firstTool = page.locator('.tool-card').first();
    await firstTool.click();
    
    await expect(page.locator('.tool-hero')).toBeVisible();
    await expect(page.locator('text=立即借用')).toBeVisible();
  });

  test('验证权限控制 - 居民无法访问用户管理', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'resident1');
    await page.fill('input[name="password"]', 'resident123');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForURL('/');
    
    await page.goto('/admin/users');
    await expect(page.url()).not.toContain('/admin/users');
  });

  test('我的借用页面正常显示', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'resident1');
    await page.fill('input[name="password"]', 'resident123');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForURL('/');
    
    await page.goto('/my-borrows');
    await expect(page.locator('text=我的借用')).toBeVisible();
  });

  test('个人中心页面正常显示', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="username"]', 'resident1');
    await page.fill('input[name="password"]', 'resident123');
    await page.getByRole('button', { name: '登录' }).click();
    await page.waitForURL('/');
    
    await page.goto('/profile');
    await expect(page.locator('text=个人中心')).toBeVisible();
    await expect(page.locator('text=退出登录')).toBeVisible();
  });
});
