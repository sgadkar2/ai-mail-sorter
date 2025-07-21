const { google } = require('googleapis');
const GmailAccount = require('../models/GmailAccount');
const Email = require('../models/Email');
const oauth2Client = require('../config/googleOAuth');
const categorizeEmail = require('../services/categorizeEmail');
const Category = require('../models/Category');
const { extractUnsubscribeLink } = require('./unsubscribeExtractor');

// Add this function to extract domain from email
function extractDomainFromEmail(email) {
  if (!email) return null;
  
  // Extract domain from email address
  const match = email.match(/@([^>]+)/);
  if (match) {
    return match[1].toLowerCase();
  }
  
  // If it's already a domain (no @), return as is
  if (!email.includes('@')) {
    return email.toLowerCase();
  }
  
  return null;
}

async function pollGmail() {
  const accounts = await GmailAccount.find();

  for (const account of accounts) {
    oauth2Client.setCredentials({
      access_token: account.accessToken,
      refresh_token: account.refreshToken,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      if (!account.historyId) {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        account.historyId = profile.data.historyId;
        await account.save();
        console.log(`Initialized historyId for ${account.email}`);
        continue;
      }

      const historyRes = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: account.historyId,
        historyTypes: ['messageAdded'],
      });

      const history = historyRes.data.history || [];
      const messageIds = history.flatMap(h => h.messages?.map(m => m.id) || []);

      for (const msgId of messageIds) {
        const msg = await gmail.users.messages.get({
          userId: 'me',
          id: msgId,
          format: 'full',
        });

        const headers = Object.fromEntries(
          (msg.data.payload.headers || []).map(h => [h.name, h.value])
        );

        const subject = headers.Subject || '';
        const body = extractPlainText(msg.data.payload);
        const htmlBody = extractHtmlText(msg.data.payload);
        const from = headers.From;
        const to = [headers.To];

        // Use the enhanced unsubscribe link extraction
        const unsubscribeLink = extractUnsubscribeLink(
            headers, 
            htmlBody, 
            body, 
            'en',
            {
                senderDomain: extractDomainFromEmail(from),
                isFooterLink: false, // You could add logic to detect this
                linkFrequency: 1 // You could count identical links
            }
        );

        // Categorize the email
        const categoryId = await categorizeEmail({
          subject,
          body,
          userId: account.user,
        });

        const generateSummary = require('./generateSummary');
        const summary = await generateSummary(subject, body);

        const email = {
          gmailAccount: account._id,
          subject,
          body, // Plain text
          htmlBody, // HTML content
          from,
          to,
          messageId: msg.data.id,
          threadId: msg.data.threadId,
          hasAttachments: msg.data.payload?.parts?.some(part => part.filename),
          rawHeaders: headers,
          category: categoryId,
          summary: summary,
          unsubscribeLink: unsubscribeLink,
        };

        await Email.updateOne(
          { messageId: msg.data.id },
          { $setOnInsert: email },
          { upsert: true }
        );

        // Auto-archive the email on Gmail
        await gmail.users.messages.modify({
          userId: 'me',
          id: msg.data.id,
          requestBody: {
            removeLabelIds: ['INBOX'],
          },
        });

        console.log(`📩 Saved: ${subject} — Category: ${categoryId || 'Uncategorized'}${unsubscribeLink ? ' 🔗' : ''}`);
      }

      if (historyRes.data.historyId) {
        account.historyId = historyRes.data.historyId;
        await account.save();
      }

    } catch (err) {
      console.error(`❌ Failed to poll for ${account.email}:`, err.message);
      if (err.code === 404) {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        account.historyId = profile.data.historyId;
        await account.save();
        console.log(`🔁 Reset historyId for ${account.email}`);
      }
    }
  }
}

function extractPlainText(payload) {
  if (!payload) return '';

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    const html = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    return stripHtmlTags(html);
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }

  return '';
}

function extractHtmlText(payload) {
  if (!payload) return '';

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8');
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      const html = extractHtmlText(part);
      if (html) return html;
    }
  }

  return '';
}

function stripHtmlTags(html) {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

module.exports = pollGmail;
