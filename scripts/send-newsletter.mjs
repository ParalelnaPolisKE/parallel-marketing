#!/usr/bin/env node

/**
 * Send an existing Mailchimp draft campaign.
 *
 * Usage: MAILCHIMP_API_KEY=... MAILCHIMP_SERVER_PREFIX=... \
 *        node scripts/send-newsletter.mjs <campaign-id>
 */

import { sendCampaign } from './lib/mailchimp.mjs';

const campaignId = process.argv[2];
if (!campaignId) {
  console.error('Usage: node scripts/send-newsletter.mjs <campaign-id>');
  console.error('Get the campaign ID from the "Create Newsletter Draft" workflow output.');
  process.exit(1);
}

try {
  await sendCampaign(campaignId);
  console.log(`Newsletter ${campaignId} sent successfully.`);
} catch (err) {
  console.error('Failed to send newsletter:', err.message);
  if (err.response?.body) {
    console.error('Detail:', JSON.stringify(err.response.body, null, 2));
  }
  process.exit(1);
}
