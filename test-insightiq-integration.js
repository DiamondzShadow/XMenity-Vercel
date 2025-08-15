#!/usr/bin/env node

/**
 * InsightIQ Integration Test Script
 * Tests the basic functionality of the InsightIQ integration
 */

require('dotenv').config({ path: '.env.local' });

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEnvironmentVariables() {
  log('blue', '🔍 Testing Environment Variables...');
  
  const requiredVars = [
    'JWT_SECRET',
    'INSIGHTIQ_CLIENT_ID',
    'INSIGHTIQ_CLIENT_SECRET',
    'INSIGHTIQ_BASE_URL'
  ];
  
  let allGood = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value.includes('your_') || value.includes('here')) {
      log('red', `❌ ${varName} is not configured`);
      allGood = false;
    } else {
      const displayValue = varName === 'JWT_SECRET' || varName.includes('SECRET') 
        ? `${value.substring(0, 10)}...` 
        : value;
      log('green', `✅ ${varName}: ${displayValue}`);
    }
  }
  
  return allGood;
}

async function testInsightIQAPI() {
  log('blue', '🔗 Testing InsightIQ API Connection...');
  
  const { insightiq } = require('./lib/insightiq');
  
  try {
    // Test with a mock username
    const testUsername = 'test_creator_123';
    const testWallet = '0x1234567890123456789012345678901234567890';
    
    log('yellow', `Testing verification for username: ${testUsername}`);
    
    const result = await insightiq.verifyCreator(testUsername, testWallet);
    
    if (result.success) {
      log('green', '✅ InsightIQ verification successful');
      log('blue', `   - Verification Level: ${result.verificationLevel}`);
      log('blue', `   - Eligible for Token Creation: ${result.eligibleForTokenCreation}`);
      
      if (result.profile) {
        log('blue', `   - Followers: ${result.profile.followers}`);
        log('blue', `   - Engagement Rate: ${result.profile.engagement.avgEngagementRate.toFixed(2)}%`);
        log('blue', `   - Authenticity Score: ${result.profile.metrics.authenticity}`);
      }
      
      return true;
    } else {
      log('red', `❌ InsightIQ verification failed: ${result.error}`);
      return false;
    }
  } catch (error) {
    log('red', `❌ InsightIQ API test error: ${error.message}`);
    return false;
  }
}

async function testTokenMetrics() {
  log('blue', '📊 Testing Token Metrics Generation...');
  
  const { insightiq } = require('./lib/insightiq');
  
  try {
    const testUsername = 'test_creator_123';
    
    const metrics = await insightiq.getTokenMetrics(testUsername);
    
    log('green', '✅ Token metrics generated successfully');
    log('blue', `   - Followers: ${metrics.followers}`);
    log('blue', `   - Engagement: ${metrics.engagement.toFixed(2)}%`);
    log('blue', `   - Reach: ${metrics.reach}`);
    log('blue', `   - Quality Score: ${metrics.qualityScore}`);
    
    // Test milestone configuration
    const profile = await insightiq.getProfile(testUsername);
    const milestones = await insightiq.getMilestoneConfig(profile);
    
    log('green', '✅ Milestone configuration generated');
    log('blue', `   - Follower milestones: ${milestones.followerMilestones.milestones.length} tiers`);
    log('blue', `   - Engagement milestones: ${milestones.engagementMilestones.milestones.length} tiers`);
    log('blue', `   - Reach milestones: ${milestones.reachMilestones.milestones.length} tiers`);
    
    return true;
  } catch (error) {
    log('red', `❌ Token metrics test error: ${error.message}`);
    return false;
  }
}

async function testJWTGeneration() {
  log('blue', '🔐 Testing JWT Token Generation...');
  
  const jwt = require('jsonwebtoken');
  
  try {
    const testPayload = {
      userId: 'test-user-id',
      walletAddress: '0x1234567890123456789012345678901234567890',
      username: 'test_creator',
      verificationLevel: 'verified',
      insightiqVerified: true
    };
    
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.username === testPayload.username && decoded.insightiqVerified) {
      log('green', '✅ JWT generation and verification successful');
      return true;
    } else {
      log('red', '❌ JWT verification failed');
      return false;
    }
  } catch (error) {
    log('red', `❌ JWT test error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  log('blue', '🚀 Starting InsightIQ Integration Tests...\n');
  
  const tests = [
    { name: 'Environment Variables', fn: testEnvironmentVariables },
    { name: 'JWT Generation', fn: testJWTGeneration },
    { name: 'InsightIQ API', fn: testInsightIQAPI },
    { name: 'Token Metrics', fn: testTokenMetrics }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
      console.log(''); // Add spacing between tests
    } catch (error) {
      log('red', `❌ Test "${test.name}" crashed: ${error.message}\n`);
    }
  }
  
  // Summary
  log('blue', '📋 Test Summary:');
  log('blue', `   Total Tests: ${tests.length}`);
  log(passedTests === tests.length ? 'green' : 'yellow', `   Passed: ${passedTests}`);
  log(passedTests < tests.length ? 'red' : 'green', `   Failed: ${tests.length - passedTests}`);
  
  if (passedTests === tests.length) {
    log('green', '\n🎉 All tests passed! InsightIQ integration is ready.');
    log('blue', '\n📋 Next steps:');
    log('blue', '   1. Configure Supabase credentials in .env.local');
    log('blue', '   2. Run: pnpm dev');
    log('blue', '   3. Visit: http://localhost:3000/launch');
    log('blue', '   4. Test the full creator verification flow');
  } else {
    log('yellow', '\n⚠️  Some tests failed. Please check the configuration.');
    log('blue', '\n📋 Common issues:');
    log('blue', '   - Missing environment variables');
    log('blue', '   - Invalid InsightIQ credentials');
    log('blue', '   - Network connectivity issues');
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    log('red', `💥 Test suite crashed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runAllTests };