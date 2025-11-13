const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

/**
 * Parses customer speech into intent + info
 * Returns JSON: { intent: 'book'|'cancel'|'unknown', service: string, date_time: string }
 */
async function parseCustomerRequest(transcript) {
    const prompt = `
You are a smart barbershop assistant. Determine if the customer wants to:
1. Book an appointment
2. Cancel an appointment
3. Check details

Extract:
- intent
- service (haircut, beard, combo)
- preferred date and time (if mentioned)
Respond in JSON format only.
Customer said: "${transcript}"
    `;

    const response = await openai.createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
    });

    try {
        return JSON.parse(response.data.choices[0].message.content);
    } catch {
        return { intent: 'unknown' };
    }
}

module.exports = { parseCustomerRequest };
