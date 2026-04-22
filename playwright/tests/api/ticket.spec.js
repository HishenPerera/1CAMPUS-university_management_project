const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/authHelper');

test.describe('Ticket API', () => {
    test.describe.configure({ mode: 'serial' });
    let studentToken;
    let adminToken;
    let testTicketId;

    const studentEmail = 'it260001@1campus.edu';
    const adminEmail = 'charuka.h@1campus.edu'; // From seedUsers.js
    const adminPassword = 'Charuka@123';

    test.beforeAll(async ({ request }) => {
        studentToken = await login(request, studentEmail, 'Mhsp@123');
        adminToken = await login(request, adminEmail, adminPassword);
    });

    test('should raise a new ticket', async ({ request }) => {
        const response = await request.post('/api/tickets/raise', {
            headers: { 'Authorization': `Bearer ${studentToken}` },
            data: {
                type: 'Academic',
                title: 'Test Playwright Ticket',
                description: 'This is a test ticket raised by Playwright.'
            }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.message).toBe('Ticket raised successfully');
        expect(body.ticket).toHaveProperty('id');
        testTicketId = body.ticket.id;
    });

    test('should fetch my tickets', async ({ request }) => {
        const response = await request.get('/api/tickets/my-tickets', {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        expect(body.some(t => t.id === testTicketId)).toBeTruthy();
    });

    test('admin should fetch all tickets', async ({ request }) => {
        const response = await request.get('/api/tickets/all', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('admin should update ticket status', async ({ request }) => {
        expect(testTicketId).toBeDefined();
        const response = await request.patch(`/api/tickets/${testTicketId}/status`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
            data: {
                status: 'In Progress',
                adminComment: 'Working on it'
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.ticket.status).toBe('In Progress');
    });

    test('should delete a pending ticket (if applicable)', async ({ request }) => {
        // We need a PENDING ticket to delete it.
        // Let's create another one for deletion test
        const createRes = await request.post('/api/tickets/raise', {
            headers: { 'Authorization': `Bearer ${studentToken}` },
            data: {
                type: 'IT Support',
                title: 'Delete Me',
                description: 'Temp ticket'
            }
        });
        const tempTicketId = (await createRes.json()).ticket.id;

        const response = await request.delete(`/api/tickets/${tempTicketId}`, {
            headers: { 'Authorization': `Bearer ${studentToken}` },
            data: { reason: 'No longer needed' }
        });
        expect(response.ok()).toBeTruthy();
        expect((await response.json()).message).toBe('Ticket deleted successfully.');
    });
});
