// services/generateSummary.js
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function generateSummary(subject, body) {
  const prompt = `
Give a summarized description for the following email in 1-2 concise sentences suitable for a user dashboard:

Subject: ${subject}

Body:
${body}
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.5,
    });

    return response.choices[0]?.message?.content?.trim();
  } catch (err) {
    console.error('❌ Error generating summary:', err.message);
    return null;
  }
}

module.exports = generateSummary;
