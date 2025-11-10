/**
 * Test script for profile sync functionality
 * Tests VSCode sync file validation and format compatibility
 */

const fs = require('fs');
const path = require('path');

// Test results
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: '✅ PASS' });
    console.log(`✅ PASS: ${name}`);
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: '❌ FAIL', error: error.message });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

// Helper: Validate sync data format (mimics VSCode validation)
function validateSyncData(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  // Must have list array
  if (!Array.isArray(data.list)) {
    return false;
  }

  // activeProfileId can be null or string
  if (data.activeProfileId !== null && typeof data.activeProfileId !== 'string') {
    return false;
  }

  // Validate each profile has required fields
  for (const profile of data.list) {
    if (!profile || typeof profile !== 'object') {
      return false;
    }

    if (!profile.id || !profile.name || !profile.persona || !profile.tone) {
      return false;
    }

    if (!Array.isArray(profile.styleGuidelines)) {
      return false;
    }

    // Validate evolving_profile structure
    if (!profile.evolving_profile || typeof profile.evolving_profile !== 'object') {
      return false;
    }

    if (!Array.isArray(profile.evolving_profile.topics)) {
      return false;
    }
  }

  return true;
}

// Helper: Parse Chrome import envelope (mimics Chrome extension)
function parseImportEnvelope(data) {
  const parsed = typeof data === 'string' ? JSON.parse(data) : data;

  // Handle versioned envelope (Chrome extension export format)
  if (parsed.schemaVersion !== undefined) {
    if (!Array.isArray(parsed.profiles)) {
      throw new Error('Invalid envelope: profiles must be an array');
    }
    return parsed.profiles;
  }

  // VSCode sync file format: {list: [...], activeProfileId: ...}
  if (parsed.list !== undefined && Array.isArray(parsed.list)) {
    console.log('   Detected VSCode sync file format');
    return parsed.list;
  }

  // Legacy format: array directly
  if (Array.isArray(parsed)) {
    return parsed;
  }

  throw new Error('Invalid import format');
}

console.log('\n🧪 Starting Profile Sync Tests...\n');
console.log('═══════════════════════════════════════════════════\n');

// Test 1: Valid VSCode sync file
test('Valid VSCode sync file passes validation', () => {
  const data = JSON.parse(fs.readFileSync('./test-data/valid-vscode-sync.json', 'utf-8'));
  assert(validateSyncData(data), 'Valid sync file should pass validation');
  assert(data.list.length === 2, 'Should have 2 profiles');
  assert(data.activeProfileId === 'test_frontend_dev', 'Should have correct active profile');
});

// Test 2: Invalid sync file (missing list)
test('Invalid sync file (missing list) fails validation', () => {
  const data = JSON.parse(fs.readFileSync('./test-data/invalid-missing-list.json', 'utf-8'));
  assert(!validateSyncData(data), 'Invalid sync file should fail validation');
});

// Test 3: Chrome export format can be parsed
test('Chrome export format can be parsed by Chrome extension', () => {
  const jsonData = fs.readFileSync('./test-data/chrome-export-format.json', 'utf-8');
  const profiles = parseImportEnvelope(jsonData);
  assert(Array.isArray(profiles), 'Should return an array of profiles');
  assert(profiles.length === 1, 'Should have 1 profile');
  assert(profiles[0].id === 'chrome_test_1', 'Should have correct profile');
});

// Test 4: VSCode sync format can be parsed by Chrome extension
test('VSCode sync format can be parsed by Chrome extension', () => {
  const jsonData = fs.readFileSync('./test-data/valid-vscode-sync.json', 'utf-8');
  const profiles = parseImportEnvelope(jsonData);
  assert(Array.isArray(profiles), 'Should return an array of profiles');
  assert(profiles.length === 2, 'Should have 2 profiles');
  assert(profiles[0].id === 'test_backend_dev', 'Should have correct first profile');
  assert(profiles[1].id === 'test_frontend_dev', 'Should have correct second profile');
});

// Test 5: VSCode sync file has all required profile fields
test('VSCode sync profiles have all required fields', () => {
  const data = JSON.parse(fs.readFileSync('./test-data/valid-vscode-sync.json', 'utf-8'));
  const profile = data.list[0];

  assert(profile.id, 'Profile should have id');
  assert(profile.name, 'Profile should have name');
  assert(profile.persona, 'Profile should have persona');
  assert(profile.tone, 'Profile should have tone');
  assert(Array.isArray(profile.styleGuidelines), 'Profile should have styleGuidelines array');
  assert(profile.evolving_profile, 'Profile should have evolving_profile');
  assert(Array.isArray(profile.evolving_profile.topics), 'Profile should have topics array');
  assert(typeof profile.evolving_profile.usageCount === 'number', 'Profile should have usageCount');
});

// Test 6: Evolving profile topics have correct structure
test('Evolving profile topics have correct structure', () => {
  const data = JSON.parse(fs.readFileSync('./test-data/valid-vscode-sync.json', 'utf-8'));
  const topic = data.list[0].evolving_profile.topics[0];

  assert(topic.name, 'Topic should have name');
  assert(typeof topic.count === 'number', 'Topic should have count');
  assert(topic.lastUsed, 'Topic should have lastUsed');
});

// Test 7: Multiple profiles with different usage counts
test('Profiles have different usage counts for merge testing', () => {
  const data = JSON.parse(fs.readFileSync('./test-data/valid-vscode-sync.json', 'utf-8'));

  const profile1 = data.list[0];
  const profile2 = data.list[1];

  assert(profile1.evolving_profile.usageCount === 8, 'First profile should have usage count 8');
  assert(profile2.evolving_profile.usageCount === 17, 'Second profile should have usage count 17');
  assert(profile2.evolving_profile.usageCount > profile1.evolving_profile.usageCount,
    'Second profile has higher usage count (for merge conflict testing)');
});

// Test 8: Chrome export format validation
test('Chrome export format has required envelope fields', () => {
  const data = JSON.parse(fs.readFileSync('./test-data/chrome-export-format.json', 'utf-8'));

  assert(data.schemaVersion === 1, 'Should have schemaVersion');
  assert(data.exportedAt, 'Should have exportedAt timestamp');
  assert(Array.isArray(data.profiles), 'Should have profiles array');
});

// Test 9: activeProfileId can be null
test('activeProfileId can be null in VSCode format', () => {
  const data = JSON.parse(fs.readFileSync('./test-data/valid-vscode-sync.json', 'utf-8'));
  data.activeProfileId = null;
  assert(validateSyncData(data), 'Sync file with null activeProfileId should be valid');
});

// Test 10: Empty profiles list is valid
test('Empty profiles list is valid', () => {
  const data = {
    list: [],
    activeProfileId: null
  };
  assert(validateSyncData(data), 'Empty profiles list should be valid');
});

// Summary
console.log('\n═══════════════════════════════════════════════════');
console.log('\n📊 Test Summary:\n');
console.log(`   Total Tests: ${results.passed + results.failed}`);
console.log(`   ✅ Passed: ${results.passed}`);
console.log(`   ❌ Failed: ${results.failed}`);
console.log(`   Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

if (results.failed > 0) {
  console.log('\n❌ Failed Tests:');
  results.tests.filter(t => t.status.includes('FAIL')).forEach(t => {
    console.log(`   - ${t.name}`);
    if (t.error) console.log(`     Error: ${t.error}`);
  });
}

console.log('\n═══════════════════════════════════════════════════\n');

// Exit with appropriate code
process.exit(results.failed > 0 ? 1 : 0);
