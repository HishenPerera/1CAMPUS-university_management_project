import { test, expect } from '@playwright/test';

test.describe('Web Admin Module Tests', () => {
  const baseURL = 'http://localhost:5173';

  // Hama test ekakatama kalin login wenna
  test.beforeEach(async ({ page }) => {
    await page.goto(`${baseURL}/login`);

    // Oyaage Login.jsx eke thiyena placeholders use kirima
    await page.fill('input#email', 'kushmi.j@1campus.edu');
    await page.fill('input#password', 'Kushmi@123');

    // Login button eka click kirima
    await page.click('button:has-text("Sign In")');

    // Dashboard ekata yana thuru bala sitima
    await expect(page).toHaveURL(new RegExp(`${baseURL}/webadmin`), { timeout: 15000 });
  });

  test('should check UI consistency for headings', async ({ page }) => {
    // Staff Management page ekata yama
    await page.click('button:has-text("Manage Staff")');

    // Assignment Requirement: Capitalization of labels check [cite: 23]
    const heading = page.locator('h2');
    await expect(heading).toContainText('Staff Management');
  });

  test('should successfully open the Add Staff modal', async ({ page }) => {
    await page.click('button:has-text("Manage Staff")');

    // "Add Staff Member" button eka click kirima
    const addBtn = page.locator('button:has-text("Add Staff Member")');
    await addBtn.click();

    // Modal eka open una bawa verify kirima
    await expect(page.locator('text=Add New Staff Member')).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await page.click('button:has-text("Manage Staff")');
    await page.click('button:has-text("Add Staff Member")');

    // Empty fields ekka submit kirima [cite: 15, 22]
    await page.click('button:has-text("Create Staff Account")');

    // Browser validation check
    const nameInput = page.locator('input[name="full_name"]');
    const validationMessage = await nameInput.evaluate(node => node.validationMessage);
    expect(validationMessage).not.toBe('');
  });

  test('should successfully navigate to Audit Logs', async ({ page }) => {
    await page.click('button:has-text("Audit Logs")');
    // Audit logs component h2 eka check kirima
    await expect(page.locator('h2')).toContainText('Audit Logs');
  });

  test('should successfully navigate to Database Management', async ({ page }) => {
    await page.click('button:has-text("Database Management")');
    // Database Management component heading check
    await expect(page.locator('h2')).toContainText('Database');
  });

  test('should display empty state for non-existent search in Staff Management', async ({ page }) => {
    await page.click('button:has-text("Manage Staff")');
    const searchInput = page.locator('input[placeholder="Search by name, email, or role…"]');
    await searchInput.fill('nonexistentuser12345');
    await expect(page.locator('text=No staff match your search.')).toBeVisible();
  });

  test('should successfully navigate to Manage Students', async ({ page }) => {
    await page.click('button:has-text("Manage Students")');
    await expect(page.locator('h2')).toBeVisible();
  });

  test('should successfully navigate to Manage Web Admins', async ({ page }) => {
    await page.click('button:has-text("Manage Web Admins")');
    await expect(page.locator('h2')).toContainText('Web Admin');
  });

  test('should successfully navigate to DB Maintenance', async ({ page }) => {
    await page.click('button:has-text("DB Maintenance")');
    await expect(page.locator('h2')).toContainText('Maintenance');
  });

  test('should successfully navigate to System Insights', async ({ page }) => {
    await page.click('button:has-text("System Insights")');
    await expect(page.locator('h2')).toContainText('Insights');
  });

  test('should successfully log out', async ({ page }) => {
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(`${baseURL}/`);
  });
});