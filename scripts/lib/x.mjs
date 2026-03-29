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

  const { data } = await client.v2.tweet(text);

  console.log(`  ✓ Published tweet ${data.id}`);
  return { tweetId: data.id, text: data.text };
}
