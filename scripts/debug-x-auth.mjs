#!/usr/bin/env node

/**
 * Debug script to isolate X API 403 issue.
 * Tests credentials step by step, including with actual post content.
 *
 * Usage: X_API_KEY=... X_API_SECRET=... X_ACCESS_TOKEN=... X_ACCESS_TOKEN_SECRET=... node scripts/debug-x-auth.mjs
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { TwitterApi } from 'twitter-api-v2';

const appKey = process.env.X_API_KEY;
const appSecret = process.env.X_API_SECRET;
const accessToken = process.env.X_ACCESS_TOKEN;
const accessSecret = process.env.X_ACCESS_TOKEN_SECRET;
const bearerToken = process.env.X_BEARER_TOKEN;

console.log('=== X API Debug v2 ===\n');
console.log('Credentials present:');
console.log(`  X_API_KEY:              ${appKey ? appKey.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`  X_API_SECRET:           ${appSecret ? appSecret.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`  X_ACCESS_TOKEN:         ${accessToken ? accessToken.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`  X_ACCESS_TOKEN_SECRET:  ${accessSecret ? accessSecret.substring(0, 6) + '...' : 'MISSING'}`);
console.log(`  X_BEARER_TOKEN:         ${bearerToken ? bearerToken.substring(0, 6) + '...' : 'MISSING'}`);

const userClient = new TwitterApi({
  appKey,
  appSecret,
  accessToken,
  accessSecret,
});

// Test 1: OAuth 1.0a - read
console.log('\n--- Test 1: OAuth 1.0a read (GET /2/users/me) ---');
try {
  const me = await userClient.v2.me();
  console.log('✓ Authenticated as:', JSON.stringify(me.data));
} catch (err) {
  console.error('✗ Read failed:', err.code, JSON.stringify(err.data || err.message));
}

// Test 2: Simple tweet (ASCII only)
console.log('\n--- Test 2: Simple ASCII tweet ---');
try {
  const { data } = await userClient.v2.tweet(`PPKE test [${Date.now()}]`);
  console.log('✓ Simple tweet OK. ID:', data.id);
  await userClient.v2.deleteTweet(data.id);
  console.log('  ✓ Deleted.');
} catch (err) {
  console.error('✗ Simple tweet failed:', err.code, JSON.stringify(err.data));
}

// Test 3: Tweet with emojis
console.log('\n--- Test 3: Tweet with emojis ---');
try {
  const { data } = await userClient.v2.tweet(`PPKE test 📅🏴⚡👇 [${Date.now()}]`);
  console.log('✓ Emoji tweet OK. ID:', data.id);
  await userClient.v2.deleteTweet(data.id);
  console.log('  ✓ Deleted.');
} catch (err) {
  console.error('✗ Emoji tweet failed:', err.code, JSON.stringify(err.data));
}

// Test 4: Tweet with URL
console.log('\n--- Test 4: Tweet with URL ---');
try {
  const { data } = await userClient.v2.tweet(`PPKE test https://events.ppke.sk/ai-prechadzka [${Date.now()}]`);
  console.log('✓ URL tweet OK. ID:', data.id);
  await userClient.v2.deleteTweet(data.id);
  console.log('  ✓ Deleted.');
} catch (err) {
  console.error('✗ URL tweet failed:', err.code, JSON.stringify(err.data));
}

// Test 5: Multi-line tweet
console.log('\n--- Test 5: Multi-line tweet ---');
try {
  const { data } = await userClient.v2.tweet(`PPKE test\n\nMulti-line\ntweet [${Date.now()}]`);
  console.log('✓ Multi-line tweet OK. ID:', data.id);
  await userClient.v2.deleteTweet(data.id);
  console.log('  ✓ Deleted.');
} catch (err) {
  console.error('✗ Multi-line tweet failed:', err.code, JSON.stringify(err.data));
}

// Test 6: Actual AI Meetup post content (from YAML)
console.log('\n--- Test 6: Actual AI Meetup post content ---');
try {
  const raw = readFileSync('content/posts/2026-03-29-ai-meetup-8.yaml', 'utf-8');
  const content = parseYaml(raw);
  const text = content.text.trim();
  console.log('Text length:', text.length, 'chars');
  console.log('Text preview:', JSON.stringify(text.substring(0, 100)) + '...');

  const { data } = await userClient.v2.tweet(text);
  console.log('✓ AI Meetup tweet OK! ID:', data.id);
  console.log('  → Deleting test tweet...');
  await userClient.v2.deleteTweet(data.id);
  console.log('  ✓ Deleted.');
} catch (err) {
  console.error('✗ AI Meetup tweet failed:', err.code);
  console.error('  Error data:', JSON.stringify(err.data, null, 2));
  if (err.code === 403) {
    console.error('\n  DIAGNOSIS: Simple tweets work but this specific content triggers 403.');
    console.error('  Likely causes:');
    console.error('  (a) Tweet text too long (check char count above vs 280 limit)');
    console.error('  (b) URL in text flagged by X spam filter');
    console.error('  (c) Content matches X automated spam detection pattern');
    console.error('  Try: shorten text or remove URL to isolate');
  }
}

// Test 7: Same text but WITHOUT URL
console.log('\n--- Test 7: AI Meetup text WITHOUT URL ---');
try {
  const raw = readFileSync('content/posts/2026-03-29-ai-meetup-8.yaml', 'utf-8');
  const content = parseYaml(raw);
  const text = content.text.trim().replace(/https?:\/\/\S+/g, '[link removed]');
  const { data } = await userClient.v2.tweet(text + ` [${Date.now()}]`);
  console.log('✓ No-URL tweet OK! ID:', data.id);
  await userClient.v2.deleteTweet(data.id);
  console.log('  ✓ Deleted.');
} catch (err) {
  console.error('✗ No-URL tweet failed:', err.code, JSON.stringify(err.data));
}

console.log('\n=== Debug complete ===');
