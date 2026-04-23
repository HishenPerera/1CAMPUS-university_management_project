import { test, expect } from '@playwright/test';

/**
 * Student Admin API Functional Tests
 * Port: 5001 | User: Charuka
 */
const BASE_URL = 'http://localhost:5001';
const adminEmail = 'charuka.h@1campus.edu'; 
const adminPassword = 'Charuka@123';

test.describe.serial('Student Admin API Functional Tests', () => {
  let adminToken;
  let applicationId;
  let ticketId;

  // 1. Authenticate and retrieve Bearer Token
  test('Admin Login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: { email: adminEmail, password: adminPassword }
    });
    
    expect(response.ok()).toBeTruthy();
    const loginData = await response.json();
    adminToken = loginData.token; 
    console.log('Login successful');
  });

  // 2. Fetch student applications
  test('Fetch Student Applications', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/admin/applications`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    expect(response.status()).toBe(200);
    const applications = await response.json();
    expect(Array.isArray(applications)).toBeTruthy();
    
    if (applications.length > 0) {
      applicationId = applications[0].id;
    }
  });

  // 3. Fetch and update student support tickets
  test('Fetch and Update Tickets', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/tickets/all`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    
    expect(response.status()).toBe(200);
    const tickets = await response.json();
    
    if (tickets.length > 0) {
      ticketId = tickets[0].id;
      
      const updateResponse = await request.patch(`${BASE_URL}/api/tickets/${ticketId}/status`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
        data: { status: 'In Progress' }
      });
      
      expect(updateResponse.status()).toBe(200);
    }
  });

  // 4. Generate AI Letter
  test('Generate AI Letter', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/admin/generate-letter`, {
      headers: { 'Authorization': `Bearer ${adminToken}` },
      data: {
        studentId: 1, 
        studentName: 'Charuka Test Admin',
        indexNumber: 'IT21000000',
        letterType: 'Character Certificate',
        reason: 'Employment Verification'
      }
    });
    
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty('letter');
  });
});