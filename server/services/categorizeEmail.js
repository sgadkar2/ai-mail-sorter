const OpenAI = require('openai');
const Category = require('../models/Category');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function categorizeEmail({ subject, body, userId }) {
  const categories = await Category.find({ user: userId });

  const systemPrompt = `
You are an AI email sorting assistant. The user has defined the following categories:

${categories.map(c => `- ${c.name}: ${c.description}`).join('\n')}

Based on the email content below, decide the most appropriate category name (just the name only):

---
Subject: ${subject}
Body:
${body}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.2,
    });

    let categoryName = response.choices[0]?.message?.content?.trim();

    // Check if the predicted category name exists for the user
    let category = categories.find(
      c => c.name.toLowerCase() === categoryName?.toLowerCase()
    );

    console.log(category);
    // Fallback to 'Uncategorized' if no match found
    if (!category) {
      category = await Category.findOneAndUpdate(
        { user: userId, name: 'Uncategorized' },
        { $setOnInsert: { description: 'Fallback category for unmatched emails' } },
        { upsert: true, new: true }
      );
    }

    return category._id;
  } catch (error) {
    console.error('❌ Error categorizing email:', error.message);
    return null;
  }
}

module.exports = categorizeEmail;
