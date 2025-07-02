/**
 * 🎭 اختبارات End-to-End لتدفق المصادقة
 * يختبر التطبيق كاملاً في المتصفح الحقيقي
 */

import { test, expect } from '@playwright/test';

test.describe('Auth Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // تنظيف localStorage قبل كل اختبار
    await page.goto('http://localhost:8081');
    await page.evaluate(() => localStorage.clear());
  });

  test('🔐 تدفق تسجيل الدخول الكامل', async ({ page }) => {
    // الانتقال لصفحة تسجيل الدخول
    await page.goto('http://localhost:8081/company-login');
    
    // التحقق من وجود النموذج
    await expect(page.locator('h1')).toContainText('تسجيل دخول الشركة');
    
    // ملء النموذج
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // إرسال النموذج
    await page.click('button[type="submit"]');
    
    // انتظار نجاح تسجيل الدخول
    await expect(page).toHaveURL('http://localhost:8081/');
    
    // التحقق من وجود المحتوى المحمي
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test('🔒 منع الوصول للصفحات المحمية', async ({ page }) => {
    // محاولة الوصول للصفحة الرئيسية بدون تسجيل دخول
    await page.goto('http://localhost:8081/');
    
    // يجب إعادة التوجيه لصفحة تسجيل الدخول
    await expect(page).toHaveURL(/.*company-login/);
  });

  test('✅ استمرارية المصادقة', async ({ page }) => {
    // تسجيل الدخول
    await page.goto('http://localhost:8081/company-login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // انتظار نجاح تسجيل الدخول
    await expect(page).toHaveURL('http://localhost:8081/');
    
    // إعادة تحميل الصفحة
    await page.reload();
    
    // يجب البقاء في الصفحة الرئيسية
    await expect(page).toHaveURL('http://localhost:8081/');
    await expect(page.locator('[data-testid="home-page"]')).toBeVisible();
  });

  test('🚪 تسجيل الخروج', async ({ page }) => {
    // تسجيل الدخول أولاً
    await page.goto('http://localhost:8081/company-login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('http://localhost:8081/');
    
    // تسجيل الخروج
    await page.click('button:has-text("تسجيل الخروج")');
    
    // يجب إعادة التوجيه لصفحة تسجيل الدخول
    await expect(page).toHaveURL(/.*company-login/);
  });

  test('❌ التعامل مع بيانات خاطئة', async ({ page }) => {
    await page.goto('http://localhost:8081/company-login');
    
    // إدخال بيانات خاطئة
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // يجب عرض رسالة خطأ
    await expect(page.locator('.error-message')).toBeVisible();
    
    // يجب البقاء في صفحة تسجيل الدخول
    await expect(page).toHaveURL(/.*company-login/);
  });

  test('📱 اختبار الاستجابة (Responsive)', async ({ page }) => {
    // اختبار على شاشة الهاتف
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8081/company-login');
    
    // التحقق من أن النموذج يظهر بشكل صحيح
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // اختبار على شاشة التابلت
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('form')).toBeVisible();
    
    // اختبار على شاشة سطح المكتب
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('form')).toBeVisible();
  });

  test('⚡ اختبار الأداء', async ({ page }) => {
    // قياس وقت تحميل الصفحة
    const startTime = Date.now();
    await page.goto('http://localhost:8081/company-login');
    const loadTime = Date.now() - startTime;
    
    // يجب أن تحمل الصفحة في أقل من 3 ثواني
    expect(loadTime).toBeLessThan(3000);
    
    // التحقق من عدم وجود أخطاء في Console
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.reload();
    expect(errors).toHaveLength(0);
  });
});
