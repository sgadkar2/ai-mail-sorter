const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const Email = require('../models/Email');
const Category = require('../models/Category');
const GmailAccount = require('../models/GmailAccount');
const oauth2Client = require('../config/googleOAuth');
const puppeteer = require('puppeteer');

// Utility to log access token scopes
async function checkTokenScopes(accessToken) {
  try {
    const tempClient = new OAuth2Client();
    const tokenInfo = await tempClient.getTokenInfo(accessToken);
    console.log('🔍 Access Token Scopes:', tokenInfo.scopes);
  } catch (err) {
    console.error('❌ Failed to fetch token info:', err.message || err);
  }
}

// Get emails by category
async function getEmailsByCategory(req, res) {
  try {
    const { categoryId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 20, search = '' } = req.query;

    // Verify the category belongs to the user
    const category = await Category.findOne({ _id: categoryId, user: userId });
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Build query
    const query = { category: categoryId };
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { from: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
    }

    // Get emails with pagination
    const skip = (page - 1) * limit;
    const emails = await Email.find(query)
      .populate('gmailAccount', 'email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Email.countDocuments(query);

    res.json({
      emails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      category
    });
  } catch (error) {
    console.error('❌ Error fetching emails by category:', error);
    res.status(500).json({ error: 'Failed to fetch emails' });
  }
}

// Get single email by ID
async function getEmailById(req, res) {
  try {
    const { emailId } = req.params;
    const userId = req.user._id;

    const email = await Email.findById(emailId)
      .populate({ path: 'gmailAccount', select: 'email user' })
      .populate('category', 'name description');

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    // Verify the email belongs to the user
    if (email.gmailAccount.user.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(email);
  } catch (error) {
    console.error('❌ Error fetching email:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
}

// Get emails summary (counts by category)
async function getEmailsSummary(req, res) {
  try {
    const userId = req.user._id;

    // Get all categories for the user
    const categories = await Category.find({ user: userId });
    
    // Get email counts by category
    const summary = await Promise.all(
      categories.map(async (category) => {
        const count = await Email.countDocuments({ category: category._id });
        return {
          categoryId: category._id,
          categoryName: category.name,
          count
        };
      })
    );

    // Get total email count
    const totalEmails = await Email.countDocuments({
      gmailAccount: { $in: await GmailAccount.find({ user: userId }).select('_id') }
    });

    res.json({
      summary,
      totalEmails
    });
  } catch (error) {
    console.error('❌ Error fetching email summary:', error);
    res.status(500).json({ error: 'Failed to fetch email summary' });
  }
}

// Bulk unsubscribe from emails
async function bulkUnsubscribe(req, res) {
  try {
    const { emailIds } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: 'emailIds array is required' });
    }

    // Get emails with unsubscribe links
    const emails = await Email.find({
      _id: { $in: emailIds },
      unsubscribeLink: { $exists: true, $ne: null }
    }).populate('gmailAccount');

    if (emails.length === 0) {
      return res.status(400).json({ error: 'No emails with unsubscribe links found' });
    }

    const results = [];
    let browser;

    try {
      // Update the puppeteer launch configuration
      browser = await puppeteer.launch({ 
        headless: true,
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      for (const email of emails) {
        try {
          const result = await processUnsubscribe(browser, email);
          results.push(result);
        } catch (error) {
          console.error(`❌ Failed to unsubscribe from ${email.subject}:`, error);
          results.push({
            emailId: email._id,
            subject: email.subject,
            success: false,
            error: error.message
          });
        }
      }
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    res.json({
      message: `Processed ${emails.length} unsubscribe requests`,
      results
    });

  } catch (error) {
    console.error('❌ Error in bulk unsubscribe:', error);
    res.status(500).json({ error: 'Failed to process unsubscribe requests' });
  }
}

// Helper function to process individual unsubscribe
async function processUnsubscribe(browser, email) {
  const page = await browser.newPage();
  
  try {
    console.log(`🔗 Processing unsubscribe for: ${email.subject}`);
    console.log(`📍 Unsubscribe URL: ${email.unsubscribeLink}`);

    await page.goto(email.unsubscribeLink, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Take a screenshot for debugging (optional)
    await page.screenshot({ 
      path: `./unsubscribe-${Date.now()}.png`,
      fullPage: true 
    });

    // Check for success indicators on the page
    const successIndicators = [
      'successfully unsubscribed',
      'unsubscribed successfully',
      'you have been unsubscribed',
      'subscription cancelled',
      'unsubscribe confirmed',
      'thank you for unsubscribing'
    ];

    const pageContent = await page.evaluate(() => document.body.innerText.toLowerCase());
    const hasSuccessMessage = successIndicators.some(indicator => 
      pageContent.includes(indicator)
    );

    // FIXED: Use proper selectors instead of :contains()
    const unsubscribeSelectors = [
      // Look for elements by text content using evaluate
      'button',
      'a',
      'input[type="submit"]',
      '[role="button"]',
      '[class*="unsubscribe"]',
      '[class*="opt-out"]',
      '[class*="remove"]',
      '[id*="unsubscribe"]',
      '[id*="opt-out"]',
      '[data-testid*="unsubscribe"]'
    ];

    let clicked = false;
    let clickedElement = null;
    
    // Strategy 1: Look for elements with unsubscribe text
    for (const selector of unsubscribeSelectors) {
      try {
        const elements = await page.$$(selector);
        for (const element of elements) {
          const text = await element.evaluate(el => el.textContent?.toLowerCase() || '');
          const className = await element.evaluate(el => el.className?.toLowerCase() || '');
          const id = await element.evaluate(el => el.id?.toLowerCase() || '');
          
          // Check if element contains unsubscribe-related text or attributes
          if (text.includes('unsubscribe') || 
              text.includes('opt-out') || 
              text.includes('remove') ||
              text.includes('cancel') ||
              text.includes('confirm') ||
              text.includes('yes') ||
              className.includes('unsubscribe') ||
              id.includes('unsubscribe')) {
            
            await element.click();
            clicked = true;
            clickedElement = `${selector} with text: "${text}"`;
            console.log(`✅ Clicked unsubscribe element: ${clickedElement}`);
            break;
          }
        }
        if (clicked) break;
      } catch (err) {
        console.log(`⚠️ Selector ${selector} failed:`, err.message);
      }
    }

    // Strategy 2: If no button found, try to fill forms
    if (!clicked) {
      try {
        // Look for email input fields and fill them
        const emailInputs = await page.$$('input[type="email"], input[name*="email"], input[id*="email"]');
        for (const input of emailInputs) {
          try {
            await input.type(email.gmailAccount.email);
            console.log('✅ Filled email input');
          } catch (err) {
            console.log('⚠️ Failed to fill email input:', err.message);
          }
        }

        // Look for submit buttons
        const submitButtons = await page.$$('input[type="submit"], button[type="submit"]');
        if (submitButtons.length > 0) {
          await submitButtons[0].click();
          clicked = true;
          clickedElement = 'form submitted';
          console.log('✅ Submitted unsubscribe form');
        }
      } catch (err) {
        console.log('⚠️ Form filling failed:', err.message);
      }
    }

    // Strategy 3: Look for any clickable element with unsubscribe text
    if (!clicked) {
      try {
        const allElements = await page.$$('*');
        for (const element of allElements) {
          try {
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            const text = await element.evaluate(el => el.textContent?.toLowerCase() || '');
            
            // Only click on interactive elements
            if (['button', 'a', 'input', 'div', 'span'].includes(tagName) &&
                (text.includes('unsubscribe') || text.includes('opt-out') || text.includes('remove'))) {
              
              await element.click();
              clicked = true;
              clickedElement = `${tagName} with text: "${text}"`;
              console.log(`✅ Clicked element: ${clickedElement}`);
              break;
            }
          } catch (err) {
            // Continue to next element
          }
        }
      } catch (err) {
        console.log('⚠️ Element search failed:', err.message);
      }
    }

    // Wait for any redirects or confirmations
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check final page content for success indicators
    const finalPageContent = await page.evaluate(() => document.body.innerText.toLowerCase());
    const finalSuccessMessage = successIndicators.some(indicator => 
      finalPageContent.includes(indicator)
    );

    // Get the final URL to check for redirects
    const finalUrl = page.url();

    return {
      emailId: email._id,
      subject: email.subject,
      success: clicked || hasSuccessMessage || finalSuccessMessage,
      message: clicked ? 
        `Clicked: ${clickedElement}` : 
        hasSuccessMessage ? 
          'Success message found on page' : 
          finalSuccessMessage ? 
            'Success message found after processing' : 
            'Page processed (no action taken)',
      details: {
        clicked: clicked,
        clickedElement: clickedElement,
        hasSuccessMessage: hasSuccessMessage,
        finalSuccessMessage: finalSuccessMessage,
        finalUrl: finalUrl,
        originalUrl: email.unsubscribeLink
      }
    };

  } catch (error) {
    console.error(`❌ Error processing unsubscribe for ${email.subject}:`, error.message);
    throw new Error(`Failed to process unsubscribe: ${error.message}`);
  } finally {
    await page.close();
  }
}

async function deleteEmails(req, res) {
  try {
    const { emailIds } = req.body; // ✅ Remove userId requirement
    const userId = req.user._id; // ✅ Get userId from authenticated user

    if (!Array.isArray(emailIds)) {
      return res.status(400).json({ error: 'emailIds (array) is required.' });
    }

    // Verify emails belong to the user
    const emailsToDelete = await Email.find({ 
      _id: { $in: emailIds },
      gmailAccount: { $in: await GmailAccount.find({ user: userId }).select('_id') }
    }).populate('gmailAccount');

    if (emailsToDelete.length === 0) {
      return res.status(404).json({ error: 'No emails found to delete.' });
    }

    const accountMap = new Map();
    for (const email of emailsToDelete) {
      const accId = email.gmailAccount._id.toString();
      if (!accountMap.has(accId)) {
        accountMap.set(accId, {
          refreshToken: email.gmailAccount.refreshToken,
          emails: [],
        });
      }
      accountMap.get(accId).emails.push(email.messageId);
    }

    for (const [_, { refreshToken, emails }] of accountMap.entries()) {
      try {
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        // Force token refresh
        const { token: accessToken } = await oauth2Client.getAccessToken();
        if (!accessToken) {
          console.warn('⚠️ Failed to get access token. Skipping...');
          continue;
        }

        // 🔍 Check scopes on the fresh access token
        await checkTokenScopes(accessToken);

        // Proceed with Gmail API
        oauth2Client.setCredentials({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

        for (const msgId of emails) {
          try {
            console.log(`📨 Deleting Gmail message: ${msgId}`);
            await gmail.users.messages.trash({
              userId: 'me',
              id: msgId,
            });
          } catch (err) {
            console.warn(`⚠️ Failed to delete Gmail message ${msgId}:`, err.response?.data || err.message || err);
            // Don't return error, just log it and continue
          }
        }
      } catch (err) {
        console.error('❌ Error during Gmail deletion:', err.message || err);
        // Don't return error, just log it and continue
      }
    }

    const result = await Email.deleteMany({ _id: { $in: emailIds } });

    return res.status(200).json({
      message: `${result.deletedCount} emails deleted from database.`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('❌ Failed to delete emails:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { 
  deleteEmails, 
  getEmailsByCategory, 
  getEmailById, 
  bulkUnsubscribe,
  getEmailsSummary 
};