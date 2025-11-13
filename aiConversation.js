// AI conversation module (CommonJS)
const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Parses customer speech into intent + info in Czech
 * Returns JSON: { intent: 'book'|'cancel'|'unknown', service: string, date_time: string }
 */
async function parseCustomerRequest(transcript) {
    const prompt = `
You are a smart barbershop assistant who understands Czech.
Determine if the customer wants to:
1. Book an appointment
2. Cancel an appointment
3. Check details

Extract:
- intent
- service (střih, vousy, combo)
- preferred date and time (if mentioned)
Respond in JSON format only.
Customer said: "${transcript}"
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0
    });

    try {
        return JSON.parse(response.choices[0].message.content);
    } catch (err) {
        console.error("Failed to parse AI response:", err);
        return { intent: "unknown" };
    }
}

module.exports = { parseCustomerRequest };
