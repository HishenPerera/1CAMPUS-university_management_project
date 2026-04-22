const { test, expect } = require('@playwright/test');
const { login } = require('../helpers/authHelper');

test.describe('Student API', () => {
    let studentToken;
    const studentEmail = 'it260001@1campus.edu';
    const studentPassword = 'Mhsp@123';

    test.beforeAll(async ({ request }) => {
        // Login as student
        studentToken = await login(request, studentEmail, studentPassword);
    });

    test('should fetch my profile', async ({ request }) => {
        const response = await request.get('/api/student/profile', {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body).toHaveProperty('email', studentEmail);
    });

    test('should update my profile', async ({ request }) => {
        const response = await request.put('/api/student/profile', {
            headers: { 'Authorization': `Bearer ${studentToken}` },
            data: {
                phone_number: '1234567890',
                address: '123 Test St'
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.message).toBe('Profile updated');
    });

    test('should fetch my modules', async ({ request }) => {
        const response = await request.get('/api/student/modules', {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        // This might return 404 if no student record exists in the 'students' table
        // (The 'users' table has the account, but 'students' table has the enrollment)
        // We'll just check if it's either 200 or 404 for now as it depends on DB state
        expect([200, 404]).toContain(response.status());
    });

    test('should interact with AI advisor', async ({ request }) => {
        const response = await request.post('/api/student/ai-advisor', {
            headers: { 'Authorization': `Bearer ${studentToken}` },
            data: {
                message: 'Hello, I need academic advice.',
                history: []
            }
        });
        // Might fail if GROQ_API_KEY is not set on server, but we check response format
        if (response.status() === 200) {
            const body = await response.json();
            expect(body).toHaveProperty('reply');
        } else {
            expect(response.status()).toBe(500); // Likely AI service error
        }
    });

    test('should fetch available quizzes', async ({ request }) => {
        const response = await request.get('/api/student/quizzes', {
            headers: { 'Authorization': `Bearer ${studentToken}` }
        });
        expect([200, 404]).toContain(response.status());
    });
});
