#!/usr/bin/env node

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { parse as parseYaml } from 'yaml';
import { publishToNostr } from './lib/nostr.mjs';
import { publishToX } from './lib/x.mjs';

const CONTENT_DIRS = ['content/posts', 'content/events', 'content/reshares'];
const LOG_DIR = 'logs/published';

async function main() {
  // Determine which files to publish:
  // If PUBLISH_FILES env is set (comma-separated), use those.
  // Otherwise, scan all content dirs for unpublished files.
  const publishFiles = process.env.PUBLISH_FILES
    ? process.env.PUBLISH_FILES.split(',').map(f => f.trim()).filter(Boolean)
    : findUnpublishedContent();

  if (publishFiles.length === 0) {
    console.log('No content files to publish.');
    return;
  }

  console.log(`Found ${publishFiles.length} file(s) to publish.`);

  for (const filePath of publishFiles) {
    console.log(`\nProcessing: ${filePath}`);
    const raw = readFileSync(filePath, 'utf-8');
    const content = parseYaml(raw);

    if (!content.text || !content.platforms || !Array.isArray(content.platforms)) {
      console.error(`  Skipping: missing required fields (text, platforms)`);
      continue;
    }

    // Check schedule - skip future posts
    if (content.schedule) {
      const scheduleDate = new Date(content.schedule);
      if (scheduleDate > new Date()) {
        console.log(`  Scheduled for ${content.schedule}, skipping for now.`);
        continue;
      }
    }

    const log = {
      file: filePath,
      title: content.title || null,
      publishedAt: new Date().toISOString(),
      platforms: {},
    };

    for (const platform of content.platforms) {
      try {
        switch (platform) {
          case 'nostr':
            log.platforms.nostr = await publishNostr(content);
            break;
          case 'x':
            log.platforms.x = await publishX(content);
            break;
          case 'facebook':
            console.log(`  ⏳ Facebook publishing not yet implemented`);
            log.platforms.facebook = { status: 'not_implemented' };
            break;
          case 'instagram':
            console.log(`  ⏳ Instagram publishing not yet implemented`);
            log.platforms.instagram = { status: 'not_implemented' };
            break;
          default:
            console.log(`  Unknown platform: ${platform}`);
        }
      } catch (err) {
        console.error(`  ✗ ${platform}: ${err.message}`);
        log.platforms[platform] = { status: 'error', error: err.message };
      }
    }

    // Write publish log
    const logFileName = `${new Date().toISOString().replace(/[:.]/g, '-')}_${basename(filePath, '.yaml')}.json`;
    const logPath = join(LOG_DIR, logFileName);
    mkdirSync(LOG_DIR, { recursive: true });
    writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n');
    console.log(`  Log written: ${logPath}`);
  }
}

async function publishNostr(content) {
  const privateKey = process.env.NOSTR_PRIVATE_KEY;
  if (!privateKey) throw new Error('NOSTR_PRIVATE_KEY not set');

  const relayStr = process.env.NOSTR_RELAYS || 'wss://relay.damus.io,wss://nos.lol,wss://relay.nostr.band';
  const relays = relayStr.split(',').map(r => r.trim());

  const result = await publishToNostr({
    text: content.text.trim(),
    privateKey,
    relays,
  });

  const successCount = result.results.filter(r => r.ok).length;
  console.log(`  ✓ Nostr: published to ${successCount}/${relays.length} relays`);

  return {
    status: 'published',
    eventId: result.eventId,
    pubkey: result.pubkey,
    relays: result.results,
  };
}

async function publishX(content) {
  if (!process.env.X_API_KEY) throw new Error('X_API_KEY not set');

  const result = await publishToX({
    text: content.text.trim(),
  });

  console.log(`  ✓ X.com: published tweet ${result.tweetId}`);

  return {
    status: 'published',
    tweetId: result.tweetId,
    text: result.text,
  };
}

function findUnpublishedContent() {
  const files = [];
  for (const dir of CONTENT_DIRS) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.endsWith('.yaml') || entry.endsWith('.yml')) {
          files.push(join(dir, entry));
        }
      }
    } catch {
      // Dir doesn't exist yet
    }
  }
  return files;
}

main().catch(err => {
  console.error('Publish failed:', err);
  process.exit(1);
});
