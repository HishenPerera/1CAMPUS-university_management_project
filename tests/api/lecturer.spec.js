const { test, expect } = require('@playwright/test');
const { login, authHeaders } = require('../helpers/authHelper');

const lecturerEmail = process.env.PLAYWRIGHT_LECTURER_EMAIL || 'alice.johnson@1campus.edu';
const lecturerPassword = process.env.PLAYWRIGHT_LECTURER_PASSWORD || 'Lect@1234';
const adminEmail = process.env.PLAYWRIGHT_ADMIN_EMAIL || 'mark.davis@1campus.edu';
const adminPassword = process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'Admin@1234';
const degreeProgram =
  process.env.PLAYWRIGHT_MODULE_DEGREE || 'Bachelor of Science in Information Technology';

test.describe.serial('Lecturer API', () => {
  let lecturerToken;
  let adminToken;
  let lecturerUser;
  let moduleId;
  let bootstrapModuleId;

  const created = {
    materialId: null,
    attendanceSessionId: null,
    quizId: null,
  };

  const runId = Date.now();
  const currentYear = new Date().getFullYear();
  const testWeekLabel = `Playwright Week ${runId}`;

  test.beforeAll(async ({ request }) => {
    const lecturerLogin = await login(request, lecturerEmail, lecturerPassword);
    lecturerToken = lecturerLogin.token;
    lecturerUser = lecturerLogin.user;

    const adminLogin = await login(request, adminEmail, adminPassword);
    adminToken = adminLogin.token;

    const modulesResponse = await request.get('/api/lecturer/modules', {
      headers: authHeaders(lecturerToken),
    });

    expect(modulesResponse.ok()).toBeTruthy();

    const modules = await modulesResponse.json();
    if (modules.length > 0) {
      moduleId = modules[0].id;
      return;
    }

    const moduleCode = `PWL${String(runId).slice(-6)}`;
    const createModuleResponse = await request.post('/api/admin/modules', {
      headers: authHeaders(adminToken),
      data: {
        module_code: moduleCode,
        module_name: `Playwright Lecturer Module ${runId}`,
        degree_program: degreeProgram,
        semester: 1,
        studying_year: 1,
        intake: 'Jan-Jun',
      },
    });

    expect(createModuleResponse.status()).toBe(201);
    const createModuleBody = await createModuleResponse.json();
    bootstrapModuleId = createModuleBody.module.id;
    moduleId = bootstrapModuleId;

    const assignResponse = await request.post(`/api/admin/modules/${moduleId}/assign`, {
      headers: authHeaders(adminToken),
      data: {
        lecturer_id: lecturerUser.id,
      },
    });

    expect(assignResponse.ok()).toBeTruthy();
  });

  test.afterAll(async ({ request }) => {
    if (created.materialId) {
      await request.delete(`/api/lecturer/modules/materials/${created.materialId}`, {
        headers: authHeaders(lecturerToken),
      });
    }

    if (created.attendanceSessionId) {
      await request.delete(`/api/lecturer/attendance/${created.attendanceSessionId}`, {
        headers: authHeaders(lecturerToken),
      });
    }

    if (created.quizId) {
      await request.delete(`/api/lecturer/quizzes/${created.quizId}`, {
        headers: authHeaders(lecturerToken),
      });
    }

    if (bootstrapModuleId) {
      await request.delete(`/api/admin/modules/${bootstrapModuleId}`, {
        headers: authHeaders(adminToken),
      });
    }
  });

  test('should protect lecturer routes from unauthenticated and non-lecturer users', async ({ request }) => {
    const unauthenticated = await request.get('/api/lecturer/modules');
    expect(unauthenticated.status()).toBe(403);
    expect(await unauthenticated.json()).toEqual({ message: 'Access denied' });

    const wrongRole = await request.get('/api/lecturer/modules', {
      headers: authHeaders(adminToken),
    });
    expect(wrongRole.status()).toBe(403);
    expect(await wrongRole.json()).toEqual({ message: 'Lecturer access required' });
  });

  test('should fetch lecturer modules', async ({ request }) => {
    const response = await request.get('/api/lecturer/modules', {
      headers: authHeaders(lecturerToken),
    });

    expect(response.ok()).toBeTruthy();

    const modules = await response.json();
    expect(Array.isArray(modules)).toBeTruthy();
    expect(modules.some((module) => module.id === moduleId)).toBeTruthy();
  });

  test('should upload, list, and delete module material', async ({ request }) => {
    const uploadResponse = await request.post(`/api/lecturer/modules/${moduleId}/materials`, {
      headers: authHeaders(lecturerToken),
      multipart: {
        year: String(currentYear),
        month: '0',
        week_label: testWeekLabel,
        file_type: 'file',
        file_name: `Playwright Notes ${runId}.txt`,
        material: {
          name: `playwright-material-${runId}.txt`,
          mimeType: 'text/plain',
          buffer: Buffer.from(`Playwright lecturer material ${runId}`),
        },
      },
    });

    expect(uploadResponse.status()).toBe(201);
    const uploadBody = await uploadResponse.json();
    expect(uploadBody.message).toBe('Material uploaded successfully');
    expect(uploadBody.material).toHaveProperty('id');
    created.materialId = uploadBody.material.id;

    const materialsResponse = await request.get(
      `/api/lecturer/modules/${moduleId}/materials?year=${currentYear}`,
      {
        headers: authHeaders(lecturerToken),
      }
    );

    expect(materialsResponse.ok()).toBeTruthy();
    const materials = await materialsResponse.json();
    const uploaded = materials.find((material) => material.id === created.materialId);

    expect(uploaded).toBeTruthy();
    expect(uploaded.file_name).toBe(`Playwright Notes ${runId}.txt`);

    const deleteResponse = await request.delete(
      `/api/lecturer/modules/materials/${created.materialId}`,
      {
        headers: authHeaders(lecturerToken),
      }
    );

    expect(deleteResponse.ok()).toBeTruthy();
    expect(await deleteResponse.json()).toEqual({
      message: 'Material deleted successfully.',
    });
    created.materialId = null;
  });

  test('should create, list, inspect, download, toggle, and delete attendance sessions', async ({
    request,
  }) => {
    const createResponse = await request.post(`/api/lecturer/modules/${moduleId}/attendance`, {
      headers: authHeaders(lecturerToken),
      data: {
        title: `Playwright Attendance ${runId}`,
        year: currentYear,
        month: 0,
        week_label: testWeekLabel,
      },
    });

    expect(createResponse.status()).toBe(201);
    const createBody = await createResponse.json();
    expect(createBody.session).toHaveProperty('id');
    expect(createBody.session.is_open).toBe(true);
    created.attendanceSessionId = createBody.session.id;

    const listResponse = await request.get(
      `/api/lecturer/modules/${moduleId}/attendance?year=${currentYear}`,
      {
        headers: authHeaders(lecturerToken),
      }
    );

    expect(listResponse.ok()).toBeTruthy();
    const sessions = await listResponse.json();
    expect(sessions.some((session) => session.id === created.attendanceSessionId)).toBeTruthy();

    const recordsResponse = await request.get(
      `/api/lecturer/attendance/${created.attendanceSessionId}/records`,
      {
        headers: authHeaders(lecturerToken),
      }
    );

    expect(recordsResponse.ok()).toBeTruthy();
    const recordsBody = await recordsResponse.json();
    expect(recordsBody.session.id).toBe(created.attendanceSessionId);
    expect(Array.isArray(recordsBody.records)).toBeTruthy();

    const downloadResponse = await request.get(
      `/api/lecturer/attendance/${created.attendanceSessionId}/download`,
      {
        headers: authHeaders(lecturerToken),
      }
    );

    expect(downloadResponse.ok()).toBeTruthy();
    expect(downloadResponse.headers()['content-type']).toContain('text/csv');
    const csv = await downloadResponse.text();
    expect(csv).toContain('Attendance Report');
    expect(csv).toContain(`Playwright Attendance ${runId}`);

    const toggleResponse = await request.patch(
      `/api/lecturer/attendance/${created.attendanceSessionId}/toggle`,
      {
        headers: authHeaders(lecturerToken),
      }
    );

    expect(toggleResponse.ok()).toBeTruthy();
    const toggleBody = await toggleResponse.json();
    expect(toggleBody.session.is_open).toBe(false);
    expect(toggleBody.message).toBe('Attendance session closed.');

    const deleteResponse = await request.delete(
      `/api/lecturer/attendance/${created.attendanceSessionId}`,
      {
        headers: authHeaders(lecturerToken),
      }
    );

    expect(deleteResponse.ok()).toBeTruthy();
    expect(await deleteResponse.json()).toEqual({ message: 'Attendance session deleted.' });
    created.attendanceSessionId = null;
  });

  test('should publish, list, inspect submissions, and delete a quiz', async ({ request }) => {
    const publishResponse = await request.post(`/api/lecturer/modules/${moduleId}/quizzes`, {
      headers: authHeaders(lecturerToken),
      data: {
        title: `Playwright Quiz ${runId}`,
        topic: 'Playwright API testing',
        difficulty: 'Medium',
        timer_minutes: 15,
        questions: [
          {
            question: 'What does Playwright provide for API testing?',
            options: ['A request client', 'A CSS framework', 'A SQL driver', 'A mail server'],
            correct_answer_index: 0,
          },
          {
            question: 'Which role is allowed on lecturer routes?',
            options: ['student', 'lecturer', 'guest', 'anonymous'],
            correct_answer_index: 1,
          },
        ],
      },
    });

    expect(publishResponse.status()).toBe(201);
    const publishBody = await publishResponse.json();
    expect(publishBody.message).toBe('Quiz published successfully!');
    expect(publishBody.quizId).toBeTruthy();
    created.quizId = publishBody.quizId;

    const quizzesResponse = await request.get('/api/lecturer/quizzes', {
      headers: authHeaders(lecturerToken),
    });

    expect(quizzesResponse.ok()).toBeTruthy();
    const quizzes = await quizzesResponse.json();
    const quiz = quizzes.find((entry) => entry.id === created.quizId);

    expect(quiz).toBeTruthy();
    expect(quiz.title).toBe(`Playwright Quiz ${runId}`);

    const submissionsResponse = await request.get(
      `/api/lecturer/quizzes/${created.quizId}/submissions`,
      {
        headers: authHeaders(lecturerToken),
      }
    );

    expect(submissionsResponse.ok()).toBeTruthy();
    const submissions = await submissionsResponse.json();
    expect(Array.isArray(submissions)).toBeTruthy();

    const deleteResponse = await request.delete(`/api/lecturer/quizzes/${created.quizId}`, {
      headers: authHeaders(lecturerToken),
    });

    expect(deleteResponse.ok()).toBeTruthy();
    expect(await deleteResponse.json()).toEqual({
      message: 'Quiz deleted successfully.',
    });
    created.quizId = null;
  });
});
