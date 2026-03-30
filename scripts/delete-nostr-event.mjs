#!/usr/bin/env node

import { finalizeEvent, getPublicKey } from 'nostr-tools/pure';
import { decode, npubEncode } from 'nostr-tools/nip19';
import { Relay } from 'nostr-tools/relay';

/**
 * Publish a NIP-09 deletion event for a given Nostr event ID.
 * Usage: NOSTR_PRIVATE_KEY=nsec1... node scripts/delete-nostr-event.mjs <eventId> [reason]
 */

const eventId = process.argv[2];
const reason = process.argv[3] || 'duplicate post';

if (!eventId) {
  console.error('Usage: node scripts/delete-nostr-event.mjs <eventId> [reason]');
  process.exit(1);
}

const privateKey = process.env.NOSTR_PRIVATE_KEY;
if (!privateKey) {
  console.error('NOSTR_PRIVATE_KEY not set');
  process.exit(1);
}

let secretKeyBytes;
if (privateKey.startsWith('nsec')) {
  const decoded = decode(privateKey);
  secretKeyBytes = decoded.data;
} else {
  secretKeyBytes = hexToBytes(privateKey);
}

const relayStr = process.env.NOSTR_RELAYS || 'wss://relay.damus.io,wss://nos.lol,wss://relay.nostr.band';
const relays = relayStr.split(',').map(r => r.trim());

// NIP-09: kind 5 deletion event
const deleteEvent = finalizeEvent({
  kind: 5,
  created_at: Math.floor(Date.now() / 1000),
  tags: [['e', eventId]],
  content: reason,
}, secretKeyBytes);

const pubkey = getPublicKey(secretKeyBytes);
console.log(`Deleting event ${eventId} from ${npubEncode(pubkey)}`);
console.log(`Reason: ${reason}`);

for (const relayUrl of relays) {
  try {
    const relay = await Relay.connect(relayUrl);
    await relay.publish(deleteEvent);
    console.log(`  ✓ Deletion sent to ${relayUrl}`);
    relay.close();
  } catch (err) {
    console.error(`  ✗ Failed on ${relayUrl}: ${err.message}`);
  }
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
