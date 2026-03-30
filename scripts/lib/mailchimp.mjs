import mailchimp from '@mailchimp/mailchimp_marketing';

/**
 * Initialize Mailchimp client from env vars.
 */
function initClient() {
  const apiKey = process.env.MAILCHIMP_API_KEY;
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  if (!apiKey || !server) {
    throw new Error('MAILCHIMP_API_KEY and MAILCHIMP_SERVER_PREFIX must be set');
  }
  mailchimp.setConfig({ apiKey, server });
  return mailchimp;
}

/**
 * Create a draft campaign (newsletter) in Mailchimp.
 * Does NOT send — board reviews in Mailchimp UI and sends manually.
 *
 * @param {Object} opts
 * @param {string} opts.subject - Email subject line
 * @param {string} opts.previewText - Preview text shown in inbox
 * @param {string} opts.htmlContent - Full HTML content of the email
 * @param {string} [opts.fromName] - Sender name
 * @returns {{ campaignId, webId, archiveUrl }}
 */
export async function createDraftCampaign({ subject, previewText, htmlContent, fromName = 'Paralelna Polis Kosice' }) {
  const client = initClient();
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!listId) throw new Error('MAILCHIMP_LIST_ID must be set');

  // Create campaign
  const campaign = await client.campaigns.create({
    type: 'regular',
    recipients: { list_id: listId },
    settings: {
      subject_line: subject,
      preview_text: previewText,
      from_name: fromName,
      reply_to: 'info@ppke.sk',
    },
  });

  console.log(`  Created draft campaign: ${campaign.id}`);

  // Set content
  await client.campaigns.setContent(campaign.id, {
    html: htmlContent,
  });

  console.log(`  Content set for campaign ${campaign.id}`);

  return {
    campaignId: campaign.id,
    webId: campaign.web_id,
    archiveUrl: campaign.archive_url,
  };
}

/**
 * Update an existing draft campaign's settings and content.
 *
 * @param {string} campaignId - Existing Mailchimp campaign ID
 * @param {Object} opts
 * @param {string} opts.subject - Email subject line
 * @param {string} opts.previewText - Preview text shown in inbox
 * @param {string} opts.htmlContent - Full HTML content of the email
 * @param {string} [opts.fromName] - Sender name
 * @returns {{ campaignId }}
 */
export async function updateDraftCampaign(campaignId, { subject, previewText, htmlContent, fromName = 'Paralelna Polis Kosice' }) {
  const client = initClient();
  const listId = process.env.MAILCHIMP_LIST_ID;
  if (!listId) throw new Error('MAILCHIMP_LIST_ID must be set');

  await client.campaigns.update(campaignId, {
    recipients: { list_id: listId },
    settings: {
      subject_line: subject,
      preview_text: previewText,
      from_name: fromName,
      reply_to: 'info@paralelnapolis.sk',
    },
  });

  console.log(`  Updated campaign settings: ${campaignId}`);

  await client.campaigns.setContent(campaignId, {
    html: htmlContent,
  });

  console.log(`  Content updated for campaign ${campaignId}`);

  return { campaignId };
}

/**
 * Send an existing draft campaign.
 * @param {string} campaignId - Mailchimp campaign ID
 */
export async function sendCampaign(campaignId) {
  const client = initClient();
  await client.campaigns.send(campaignId);
  console.log(`  Campaign ${campaignId} sent.`);
}
