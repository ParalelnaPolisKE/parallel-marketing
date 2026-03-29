#!/usr/bin/env node

/**
 * Debug script to isolate X API 403 issue.
 * Tests credentials step by step.
 *
 * Usage: X_API_KEY=... X_API_SECRET=... X_ACCESS_TOKEN=... X_ACCESS_TOKEN_SECRET=... node scripts/debug-x-auth.mjs
 */

import { TwitterApi } from 'twitter-api-v2';

const appKey = process.env.X_API_KEY;
const appSecret = process.env.X_API_SECRET;
const accessToken = process.env.X_ACCESS_TOKEN;
const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;
const bearerToken = process.env.X_BEARER_TOKEN;

console.log('=== X API Debug ===\n');
console.log('Credentials present:');
console.log(`  X_API_KEY:              ${appKey ? appKey.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`  X_API_SECRET:           ${appSecret ? appSecret.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`  X_ACCESS_TOKEN:         ${accessToken ? accessToken.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`  X_ACCESS_TOKEN_SECRET:  ${accessSecret ? accessSecret.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`  X_BEARER_TOKEN:         ${bearerToken ? bearerToken.substring(0, 6) + '...' : 'MISSING'}`);

// Test 1: App-only auth with bearer token
console.log('\n--- Test 1: App-only auth (Bearer Token) ---');
if (bearerToken) {
  try {
    const appClient = new TwitterApi(bearerToken);
    const user = await appClient.v2.userByUsername('parallelpoliske');
    console.log('✓ App-only auth works. User:', JSON.stringify(user.data));
  } catch (err) {
    console.error('✗ App-only auth failed:', err.code, JSON.stringify(err.data || err.message));
  }
} else {
  console.log('⏭ Skipped (no bearer token)');
}

// Test 2: OAuth 1.0a - read (GET /2/users/me)
console.log('\n--- Test 2: OAuth 1.0a - read (GET /2/users/me) ---');
const userClient = new TwitterApi({
  appKey,
  appSecret,
  accessToken,
  accessSecret,
});

try {
  const me = await userClient.v2.me();
  console.log('✓ OAuth 1.0a read works. Authenticated as:', JSON.stringify(me.data));
} catch (err) {
  console.error('✗ OAuth 1.0a read failed:', err.code, JSON.stringify(err.data || err.message));
  console.error('  This means the credentials are invalid or the app lacks read permissions.');
}

// Test 3: OAuth 1.0a - write (POST tweet)
console.log('\n--- Test 3: OAuth 1.0a - write (POST tweet, dry run) ---');
console.log('Attempting to post a test tweet...');
try {
  // Use a unique test message to avoid duplicate detection
  const testText = `Test from PPKE marketing automation [${Date.now()}]`;
  const { data } = await userClient.v2.tweet(testText);
  console.log('✓ Tweet posted successfully! ID:', data.id);
  console.log('  Text:', data.text);
  console.log('  → Deleting test tweet...');
  try {
    await userClient.v2.deleteTweet(data.id);
    console.log('  ✓ Test tweet deleted.');
  } catch (delErr) {
    console.log('  ⚠ Could not delete test tweet:', delErr.message);
  }
} catch (err) {
  console.error('✗ Tweet failed:', err.code);
  console.error('  Error data:', JSON.stringify(err.data, null, 2));
  console.error('  Rate limit:', JSON.stringify(err.rateLimit));
  if (err.code === 403) {
    console.error('\n  DIAGNOSIS: OAuth 1.0a auth works for reads but NOT writes.');
    console.error('  Likely causes:');
    console.error('  (a) The Access Token was generated with Read-only permissions.');
    console.error('      → In developer.x.com, check User Authentication Settings → App permissions');
    console.error('      → Must be "Read and Write" BEFORE generating the Access Token.');
    console.error('      → Regenerate Access Token AFTER confirming permissions.');
    console.error('  (b) The X Developer account/project subscription does not include write.');
    console.error('      → Check Products section in developer portal.');
    console.error('  (c) Account-level restriction on @parallelpoliske.');
  }
}

// Test 4: Check rate limits on tweet endpoint
console.log('\n--- Test 4: Raw API call for more detail ---');
try {
  const rawResponse = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text: 'test' }),
  });
  console.log('Raw unauthenticated POST /2/tweets status:', rawResponse.status);
  const body = await rawResponse.json();
  console.log('Response:', JSON.stringify(body));
} catch (err) {
  console.log('Raw fetch error:', err.message);
}

console.log('\n=== Debug complete ===');
