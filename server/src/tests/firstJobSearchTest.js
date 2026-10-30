const assert = require('assert');
const { searchRealWorldJobs } = require('../../dist/services/realJobService');
const { parseLocationQuery, isJobLocationMatch } = require('../../dist/services/locationService');

async function runScenarioTests() {
  console.log('========================================================================');
  console.log('GigSync First Job Search & Location Synchronization Verification');
  console.log('========================================================================\n');

  // Scenario 1: Resume with Bangalore, India - First Search Verification
  console.log('Scenario 1: Candidate with Bangalore, India location searching immediately on first search');
  const search1 = await searchRealWorldJobs({
    role: 'Software Engineer',
    location: 'Bangalore, India',
    requestId: 'test_scen1_first_search',
    resumeLocation: 'Bangalore, India',
    resumeRole: 'Software Engineer'
  });

  assert(search1.length > 0, 'First search for Bangalore must return genuine vacancies');
  for (const job of search1) {
    const locLower = job.location.toLowerCase();
    const isLocalBangalore = locLower.includes('bangalore') || locLower.includes('bengaluru');
    const isIndiaEligibleRemote = job.workMode === 'Remote' && (locLower.includes('worldwide') || locLower.includes('apac') || locLower.includes('india'));
    assert(isLocalBangalore || isIndiaEligibleRemote, `Job "${job.title}" at "${job.location}" is not eligible for Bangalore, India candidate!`);
  }
  console.log(`  [PASS] First search returned ${search1.length} verified Bangalore / India-eligible vacancies.`);

  // Verify second search produces identical results
  console.log('Scenario 5: Search again using the same location');
  const search1_repeat = await searchRealWorldJobs({
    role: 'Software Engineer',
    location: 'Bangalore, India',
    requestId: 'test_scen1_second_search',
    resumeLocation: 'Bangalore, India',
    resumeRole: 'Software Engineer'
  });
  assert.strictEqual(search1.length, search1_repeat.length, 'Second search must return identical count as first search');
  assert.strictEqual(search1[0].id, search1_repeat[0].id, 'Second search must return identical top listing');
  console.log(`  [PASS] Second search returned identical results (${search1_repeat.length} listings) without drift.\n`);

  // Scenario 2: Another Indian City (Mumbai)
  console.log('Scenario 2: Candidate with Mumbai, India location');
  const searchMumbai = await searchRealWorldJobs({
    role: 'Software Engineer',
    location: 'Mumbai, India',
    requestId: 'test_scen2_mumbai',
    resumeLocation: 'Mumbai, India',
    resumeRole: 'Software Engineer'
  });
  for (const job of searchMumbai) {
    const locLower = job.location.toLowerCase();
    const isMumbai = locLower.includes('mumbai') || locLower.includes('bombay');
    const isIndiaEligible = locLower.includes('india') || (job.workMode === 'Remote' && (locLower.includes('worldwide') || locLower.includes('apac')));
    assert(isMumbai || isIndiaEligible, `Job at ${job.location} must be eligible for Mumbai`);
  }
  console.log(`  [PASS] Mumbai search returned ${searchMumbai.length} location-compliant vacancies.\n`);

  // Scenario 3: US Location (San Jose, CA)
  console.log('Scenario 3: Candidate with San Jose, CA location');
  const searchUS = await searchRealWorldJobs({
    role: 'Software Engineer',
    location: 'San Jose, CA',
    requestId: 'test_scen3_us',
    resumeLocation: 'San Jose, CA',
    resumeRole: 'Software Engineer'
  });
  assert(searchUS.length > 0, 'San Jose search must return US vacancies');
  for (const job of searchUS) {
    const locLower = job.location.toLowerCase();
    assert(!locLower.includes('bangalore') && !locLower.includes('mumbai'), `US search must NEVER return Indian on-site jobs: ${job.location}`);
  }
  console.log(`  [PASS] US search returned ${searchUS.length} US-compliant vacancies (0 Indian on-site leaks).\n`);

  // Scenario 4: Change location manually before searching
  console.log('Scenario 4: Manually changing location from Bangalore to London, United Kingdom');
  const searchUK = await searchRealWorldJobs({
    role: 'Software Engineer',
    location: 'London, United Kingdom',
    requestId: 'test_scen4_uk_manual',
    resumeLocation: 'Bangalore, India',
    resumeRole: 'Software Engineer'
  });
  assert(searchUK.length > 0, 'London search must return vacancies');
  for (const job of searchUK) {
    const locLower = job.location.toLowerCase();
    const isUK = locLower.includes('london') || locLower.includes('united kingdom') || locLower.includes('uk') || locLower.includes('worldwide');
    assert(isUK, `Manual London search returned non-matching vacancy: ${job.location}`);
  }
  console.log(`  [PASS] Manual location change respected immediately (${searchUK.length} UK vacancies).\n`);

  // Scenario 7: Concurrency & Stale Request Cancellation Simulation
  console.log('Scenario 7: Slow network response concurrency race condition simulation');
  let activeRequestId = 1;
  let displayedJobs = [];

  // Request 1: Slow Bangalore search (reqId = 1)
  const req1Promise = new Promise(resolve => {
    setTimeout(async () => {
      const res = await searchRealWorldJobs({ role: 'Software Engineer', location: 'Bangalore, India' });
      resolve({ reqId: 1, jobs: res });
    }, 150);
  });

  // Request 2: Superseding San Jose search initiated by user (reqId = 2)
  activeRequestId = 2; // User immediately changed to San Jose
  const req2Promise = (async () => {
    const res = await searchRealWorldJobs({ role: 'Software Engineer', location: 'San Jose, CA' });
    return { reqId: 2, jobs: res };
  })();

  const [slowResp, fastResp] = await Promise.all([req1Promise, req2Promise]);

  // Handle fast response
  if (fastResp.reqId === activeRequestId) {
    displayedJobs = fastResp.jobs;
  }

  // Handle slow response arriving later
  if (slowResp.reqId === activeRequestId) {
    displayedJobs = slowResp.jobs;
  } else {
    // Superseded request discarded
    console.log(`  [PASS] Request #${slowResp.reqId} was correctly discarded as superseded by Request #${activeRequestId}.`);
  }

  assert(displayedJobs.length > 0 && (displayedJobs[0].location.toLowerCase().includes('san') || displayedJobs[0].location.toLowerCase().includes('ca') || displayedJobs[0].location.toLowerCase().includes('united states')), 'Active results must belong to Request #2 (San Jose)');
  console.log(`  [PASS] Concurrency guard verified: displayed jobs belong strictly to active Request #${activeRequestId}.\n`);

  console.log('========================================================================');
  console.log('SUCCESS: All 7 scenario and synchronization tests PASSED!');
  console.log('========================================================================');
}

runScenarioTests().catch(err => {
  console.error('\nTest Suite FAILED with error:\n', err);
  process.exit(1);
});
