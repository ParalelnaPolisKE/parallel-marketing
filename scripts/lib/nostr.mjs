import { finalizeEvent, getPublicKey } from 'nostr-tools/pure';
import { decode, npubEncode } from 'nostr-tools/nip19';
import { Relay } from 'nostr-tools/relay';

/**
 * Publish a text note (kind 1) to Nostr relays.
 * Returns an array of { relay, eventId, ok } results.
 */
export async function publishToNostr({ text, privateKey, relays }) {
  // Decode nsec to hex if needed
  let secretKeyBytes;
  if (privateKey.startsWith('nsec')) {
    const decoded = decode(privateKey);
    secretKeyBytes = decoded.data;
  } else {
    secretKeyBytes = hexToBytes(privateKey);
  }

  const event = finalizeEvent({
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: text,
  }, secretKeyBytes);

  const pubkey = getPublicKey(secretKeyBytes);
  const eventId = event.id;

  console.log(`Publishing event ${eventId} from ${npubEncode(pubkey)}`);

  const results = [];

  for (const relayUrl of relays) {
    try {
      const relay = await Relay.connect(relayUrl);
      await relay.publish(event);
      console.log(`  ✓ Published to ${relayUrl}`);
      results.push({ relay: relayUrl, eventId, ok: true });
      relay.close();
    } catch (err) {
      console.error(`  ✗ Failed on ${relayUrl}: ${err.message}`);
      results.push({ relay: relayUrl, eventId, ok: false, error: err.message });
    }
  }

  return { eventId, pubkey: npubEncode(pubkey), results };
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}
