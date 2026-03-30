import { TwitterApi } from 'twitter-api-v2';
import { readFileSync } from 'fs';

/**
 * Publish a tweet to X.com using API v2 with OAuth 1.0a user context.
 * Supports optional image attachments via media upload.
 * Returns { tweetId, text }.
 */
export async function publishToX({ text, images = [] }) {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });

  try {
    // Upload images if provided
    const mediaIds = [];
    for (const img of images) {
      if (img.localPath) {
        const buffer = readFileSync(img.localPath);
        const mediaId = await client.v1.uploadMedia(buffer, {
          mimeType: img.mimeType || 'image/jpeg',
        });
        mediaIds.push(mediaId);
        console.log(`  ✓ Uploaded media ${mediaId} (${img.localPath})`);
      }
    }

    const tweetPayload = mediaIds.length > 0
      ? { text, media: { media_ids: mediaIds } }
      : text;

    const { data } = await client.v2.tweet(tweetPayload);
    console.log(`  ✓ Published tweet ${data.id}`);
    return { tweetId: data.id, text: data.text };
  } catch (err) {
    // Log full error details for debugging
    const detail = {
      code: err.code,
      data: err.data,
      rateLimit: err.rateLimit,
      message: err.message,
    };
    console.error(`  X API error detail:`, JSON.stringify(detail, null, 2));

    if (err.code === 403) {
      throw new Error(
        `X API 403 Forbidden. Possible causes:\n` +
        `  1. App permissions must be "Read and Write" in developer.x.com\n` +
        `  2. Access Token + Secret must be regenerated AFTER changing permissions\n` +
        `  3. Free tier: check that your app has tweet.write access\n` +
        `  4. Your X Developer account/app may be suspended or restricted\n` +
        `  Detail: ${JSON.stringify(err.data || err.message)}`
      );
    }
    throw err;
  }
}
