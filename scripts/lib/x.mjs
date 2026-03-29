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
    if (err.data) {
      console.error(`  X API error detail:`, JSON.stringify(err.data));
    }
    if (err.code === 403) {
      throw new Error(
        `X API 403 Forbidden. Check: (1) App permissions are "Read and Write" in X Developer Portal, ` +
        `(2) Access tokens were regenerated AFTER setting write permissions, ` +
        `(3) App is not suspended. Detail: ${JSON.stringify(err.data || err.message)}`
      );
    }
    throw err;
  }
}
