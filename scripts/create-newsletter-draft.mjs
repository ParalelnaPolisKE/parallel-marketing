#!/usr/bin/env node

/**
 * Reads a newsletter YAML, builds HTML from template, creates a Mailchimp draft campaign.
 * Board reviews and sends from Mailchimp UI.
 *
 * Usage: MAILCHIMP_API_KEY=... MAILCHIMP_LIST_ID=... MAILCHIMP_SERVER_PREFIX=... \
 *        node scripts/create-newsletter-draft.mjs content/newsletters/2026-03-30-newsletter.yaml
 */

import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { createDraftCampaign } from './lib/mailchimp.mjs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/create-newsletter-draft.mjs <newsletter.yaml>');
  process.exit(1);
}

const raw = readFileSync(filePath, 'utf-8');
const newsletter = parseYaml(raw);

// Build HTML content from sections
const sectionsHtml = newsletter.sections.map(section => {
  let html = '';

  if (section.type === 'event') {
    html += `<h2>${section.heading}</h2>\n`;
    html += `<div class="event-card">\n`;
    html += `  <p>${section.body.trim().replace(/\n\n/g, '</p>\n  <p>')}</p>\n`;
    if (section.eventDate) {
      const date = new Date(section.eventDate);
      const formatted = date.toLocaleDateString('sk-SK', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const time = date.toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' });
      html += `  <p class="detail"><strong>Kedy:</strong> ${formatted}, ${time}</p>\n`;
    }
    if (section.eventLocation) {
      html += `  <p class="detail"><strong>Kde:</strong> ${section.eventLocation}</p>\n`;
    }
    if (section.link) {
      html += `  <a href="${section.link}" class="cta-button">${section.linkText || 'Viac info'}</a>\n`;
    }
    html += `</div>\n`;
  } else {
    html += `<h2>${section.heading}</h2>\n`;
    html += `<p>${section.body.trim().replace(/\n\n/g, '</p>\n<p>')}</p>\n`;
    if (section.link) {
      html += `<p><a href="${section.link}">${section.linkText || section.link}</a></p>\n`;
    }
  }

  return html;
}).join('\n<hr class="divider">\n\n');

// Load template and inject content
const template = readFileSync('templates/newsletter/default.html', 'utf-8');
const fullHtml = template
  .replace('{{subject}}', newsletter.subject)
  .replace('{{content}}', sectionsHtml);

console.log('Newsletter HTML built successfully.');
console.log(`Subject: ${newsletter.subject}`);
console.log(`Sections: ${newsletter.sections.length}`);
console.log(`HTML length: ${fullHtml.length} chars\n`);

// Create draft campaign in Mailchimp
try {
  const result = await createDraftCampaign({
    subject: newsletter.subject,
    previewText: newsletter.previewText,
    htmlContent: fullHtml,
  });

  console.log('Draft campaign created in Mailchimp:');
  console.log(`  Campaign ID: ${result.campaignId}`);
  console.log(`  Web ID: ${result.webId}`);
  if (result.archiveUrl) {
    console.log(`  Archive URL: ${result.archiveUrl}`);
  }
  console.log('\nBoard can review and send from Mailchimp dashboard.');
} catch (err) {
  console.error('Failed to create Mailchimp draft:', err.message);
  if (err.response?.body) {
    console.error('Detail:', JSON.stringify(err.response.body, null, 2));
  }
  process.exit(1);
}
