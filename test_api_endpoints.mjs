import assert from 'assert';

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting GigSync API Integration Verification ---');
  let passCount = 0;

  // 1. Test /api/auth/guest (both POST and GET)
  {
    console.log('[1/8] Testing /api/auth/guest...');
    const postRes = await fetch(`${BASE_URL}/api/auth/guest`, { method: 'POST' });
    assert.strictEqual(postRes.status, 200, 'POST /api/auth/guest must return 200');
    assert.ok(postRes.headers.get('content-type')?.includes('application/json'), 'Must return JSON');
    const postData = await postRes.json();
    assert.ok(postData.user && postData.profile, 'Must return user and profile');

    const getRes = await fetch(`${BASE_URL}/api/auth/guest`, { method: 'GET' });
    assert.strictEqual(getRes.status, 200, 'GET /api/auth/guest must return 200');
    console.log('✓ /api/auth/guest works for both POST and GET.');
    passCount++;
  }

  // 2. Test /api/jobs
  {
    console.log('[2/8] Testing /api/jobs...');
    const res = await fetch(`${BASE_URL}/api/jobs`);
    assert.strictEqual(res.status, 200, 'GET /api/jobs must return 200');
    assert.ok(res.headers.get('content-type')?.includes('application/json'), 'Must return JSON');
    const jobs = await res.json();
    assert.ok(Array.isArray(jobs), 'Jobs must be an array');
    assert.ok(jobs.length > 0, 'Seeded jobs must be returned');
    console.log(`✓ /api/jobs returned ${jobs.length} jobs with valid JSON.`);
    passCount++;
  }

  // 3. Test /api/saved-jobs
  {
    console.log('[3/8] Testing /api/saved-jobs...');
    const getRes = await fetch(`${BASE_URL}/api/saved-jobs`);
    assert.strictEqual(getRes.status, 200);
    const saved = await getRes.json();
    assert.ok(Array.isArray(saved), 'Saved jobs must be an array');

    const postRes = await fetch(`${BASE_URL}/api/saved-jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: 'job_2', status: 'saved', notes: 'Test note' })
    });
    assert.strictEqual(postRes.status, 201);
    const created = await postRes.json();
    assert.strictEqual(created.jobId, 'job_2');

    const delRes = await fetch(`${BASE_URL}/api/saved-jobs/job_2`, { method: 'DELETE' });
    assert.strictEqual(delRes.status, 200);
    console.log('✓ /api/saved-jobs handles GET, POST, and DELETE correctly.');
    passCount++;
  }

  // 4. Test /api/roadmap
  {
    console.log('[4/8] Testing /api/roadmap...');
    const res = await fetch(`${BASE_URL}/api/roadmap`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('application/json'), 'Must return JSON');
    const roadmap = await res.json();
    assert.ok(roadmap.stages && Array.isArray(roadmap.stages), 'Roadmap must contain stages array');
    console.log(`✓ /api/roadmap returned roadmap with ${roadmap.stages.length} stages.`);
    passCount++;
  }

  // 5. Test /api/profile (GET, PUT, POST)
  {
    console.log('[5/8] Testing /api/profile...');
    const getRes = await fetch(`${BASE_URL}/api/profile`);
    assert.strictEqual(getRes.status, 200);
    const profile = await getRes.json();
    assert.ok(profile.personalInfo, 'Profile must have personalInfo');

    const putRes = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        personalInfo: {
          ...profile.personalInfo,
          fullName: 'Test Candidate Profile'
        }
      })
    });
    assert.strictEqual(putRes.status, 200);
    const updated = await putRes.json();
    assert.strictEqual(updated.profile.personalInfo.fullName, 'Test Candidate Profile');

    // Also verify POST /api/profile
    const postRes = await fetch(`${BASE_URL}/api/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...profile,
        personalInfo: {
          ...profile.personalInfo,
          fullName: 'Test Candidate Profile POST'
        }
      })
    });
    assert.strictEqual(postRes.status, 200);
    console.log('✓ /api/profile handles GET, PUT, and POST correctly.');
    passCount++;
  }

  // 6. Test /api/ai/resume-assistant (GET and POST)
  {
    console.log('[6/8] Testing /api/ai/resume-assistant...');
    const getRes = await fetch(`${BASE_URL}/api/ai/resume-assistant`);
    assert.strictEqual(getRes.status, 200);
    const initialData = await getRes.json();
    assert.ok(initialData.state && initialData.reply, 'Must return initial state and reply');

    const postRes = await fetch(`${BASE_URL}/api/ai/resume-assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userText: 'Elena Rostova - Robotics Systems Engineer',
        currentState: initialData.state
      })
    });
    assert.strictEqual(postRes.status, 200);
    const turnData = await postRes.json();
    assert.ok(turnData.state && turnData.reply, 'Turn must return next state and reply');
    console.log('✓ /api/ai/resume-assistant handles initial conversation and turn updates.');
    passCount++;
  }

  // 7. Test /api/parser/upload (multipart/form-data)
  {
    console.log('[7/8] Testing /api/parser/upload...');
    const boundary = '----WebKitFormBoundaryGigSyncTestBoundary';
    const textContent = `Elena Rostova\nelena.rostova@caltech.edu | (626) 395-6811 | Pasadena, CA\n\nEDUCATION\nCalifornia Institute of Technology\nMaster of Science in Computational Neural Systems, 2022 - 2025\n\nSKILLS\nPython, PyTorch, C++, CUDA, Linux, Git, Docker\n\nEXPERIENCE\nCaltech Lab\nAI Researcher\n- Developed spiked neural network models.`;
    
    const body = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="resume"; filename="elena_rostova.txt"\r\n` +
      `Content-Type: text/plain\r\n\r\n` +
      `${textContent}\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${BASE_URL}/api/parser/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Accept': 'application/json'
      },
      body
    });

    assert.strictEqual(res.status, 200, 'Upload must succeed');
    const uploadData = await res.json();
    assert.strictEqual(uploadData.success, true);
    assert.strictEqual(uploadData.extractedProfile.personalInfo.fullName, 'Elena Rostova');
    assert.strictEqual(uploadData.extractedProfile.personalInfo.email, 'elena.rostova@caltech.edu');
    assert.ok(!JSON.stringify(uploadData).includes('%PDF'), 'Must not contain %PDF artifacts');
    console.log('✓ /api/parser/upload parses resume cleanly without %PDF artifacts.');
    passCount++;
  }

  // 8. Test 404 handling on unhandled API route
  {
    console.log('[8/8] Testing unhandled API route returns JSON 404 (NOT HTML)...');
    const res = await fetch(`${BASE_URL}/api/nonexistent-route-endpoint`);
    assert.strictEqual(res.status, 404);
    assert.ok(res.headers.get('content-type')?.includes('application/json'), 'Must return JSON');
    const errData = await res.json();
    assert.ok(errData.error, 'Must return JSON error object');
    console.log('✓ Unhandled /api/* routes cleanly return JSON 404 instead of HTML.');
    passCount++;
  }

  console.log(`\n========================================`);
  console.log(`ALL ${passCount}/8 API INTEGRATION TESTS PASSED!`);
  console.log(`========================================\n`);
}

runTests().catch(err => {
  console.error('Test verification failed:', err);
  process.exit(1);
});
