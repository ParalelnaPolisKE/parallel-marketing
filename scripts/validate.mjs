#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse as parseYaml } from 'yaml';

const CONTENT_DIRS = ['content/posts', 'content/events', 'content/reshares'];
const VALID_PLATFORMS = ['facebook', 'instagram', 'x', 'nostr'];
const VALID_TYPES = ['post', 'event', 'reshare'];

let errors = 0;

function validate(filePath) {
  const raw = readFileSync(filePath, 'utf-8');
  let content;
  try {
    content = parseYaml(raw);
  } catch (err) {
    console.error(`✗ ${filePath}: Invalid YAML - ${err.message}`);
    errors++;
    return;
  }

  if (!content || typeof content !== 'object') {
    console.error(`✗ ${filePath}: Empty or non-object YAML`);
    errors++;
    return;
  }

  // Required: text
  if (!content.text || typeof content.text !== 'string') {
    console.error(`✗ ${filePath}: Missing or invalid 'text' field`);
    errors++;
  }

  // Required: platforms (array of valid values)
  if (!Array.isArray(content.platforms) || content.platforms.length === 0) {
    console.error(`✗ ${filePath}: Missing or empty 'platforms' array`);
    errors++;
  } else {
    for (const p of content.platforms) {
      if (!VALID_PLATFORMS.includes(p)) {
        console.error(`✗ ${filePath}: Unknown platform '${p}'. Valid: ${VALID_PLATFORMS.join(', ')}`);
        errors++;
      }
    }
  }

  // Optional but validated: type
  if (content.type && !VALID_TYPES.includes(content.type)) {
    console.error(`✗ ${filePath}: Unknown type '${content.type}'. Valid: ${VALID_TYPES.join(', ')}`);
    errors++;
  }

  // Optional: schedule (must be valid ISO date)
  if (content.schedule) {
    const d = new Date(content.schedule);
    if (isNaN(d.getTime())) {
      console.error(`✗ ${filePath}: Invalid schedule date '${content.schedule}'`);
      errors++;
    }
  }

  // Event-specific: if type=event, must have event.start
  if (content.type === 'event') {
    if (!content.event || !content.event.start) {
      console.error(`✗ ${filePath}: Event type requires 'event.start' field`);
      errors++;
    }
  }

  if (errors === 0) {
    console.log(`✓ ${filePath}`);
  }
}

function main() {
  // If specific files are passed as args, validate those
  const args = process.argv.slice(2);
  const files = args.length > 0
    ? args
    : findContentFiles();

  if (files.length === 0) {
    console.log('No content files found to validate.');
    return;
  }

  for (const f of files) {
    validate(f);
  }

  if (errors > 0) {
    console.error(`\n${errors} error(s) found.`);
    process.exit(1);
  } else {
    console.log(`\n${files.length} file(s) validated successfully.`);
  }
}

function findContentFiles() {
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
      // Dir doesn't exist
    }
  }
  return files;
}

main();
