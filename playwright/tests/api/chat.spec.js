const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/authHelper');

test.describe('Chat API', () => {
    let studentToken;
    let lecturerToken;

    const studentEmail = 'it260001@1campus.edu';
    const lecturerEmail = 'mohiru.t@1campus.edu';
    const lecturerPassword = 'Mohiru@123';

    test.beforeAll(async ({ request }) => {
        studentToken = await login(request, studentEmail, 'Mhsp@123');
        lecturerToken = await login(request, lecturerEmail, lecturerPassword);
    });

    test('student should fetch contacts (should see lecturers)', async ({ request }) => {
        const response = await request.get('/api/chat/contacts', {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        // Check if Alice Johnson is in the contacts
        expect(body.some(c => c.email === lecturerEmail)).toBeTruthy();
        expect(body.every(c => c.role === 'lecturer')).toBeTruthy();
    });

    test('lecturer should fetch contacts', async ({ request }) => {
        const response = await request.get('/api/chat/contacts', {
            headers: { 'Authorization': `Bearer ${lecturerToken}` }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        // Note: Lecturers only see students they have a history with.
        // It might be empty if no messages were sent yet.
    });

    test('should fetch chat history', async ({ request, baseURL }) => {
        // First get contacts to find a contact ID
        const contactsRes = await request.get('/api/chat/contacts', {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        const contacts = await contactsRes.json();
        if (contacts.length > 0) {
            const contactId = contacts[0].id;
            const response = await request.get(`/api/chat/history/${contactId}`, {
                headers: { 'Authorization': `Bearer ${studentToken}` }
            });
            expect(response.ok()).toBeTruthy();
            const body = await response.json();
            expect(Array.isArray(body)).toBeTruthy();
        }
    });

    test('unauthorized user should be blocked', async ({ request }) => {
        const response = await request.get('/api/chat/contacts');
        expect(response.status()).toBe(403); // Access denied
    });
});
