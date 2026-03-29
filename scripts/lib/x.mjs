import { TwitterApi } from 'twitter-api-v2';

/**
 * Publish a tweet to X.com using API v2 with OAuth 1.0a user context.
 * Returns { tweetId, text }.
 */
export async function publishToX({ text }) {
  const client = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
  });

  try {
    const { data } = await client.v2.tweet(text);
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
