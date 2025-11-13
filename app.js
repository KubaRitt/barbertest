require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { parseCustomerRequest } = require('./aiConversation');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// ====================
// 1️⃣ Voice Webhook
// ====================
app.post('/voice', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    twiml.say('Hello! Welcome to our barbershop.', { voice: 'alice' });
    twiml.gather({
        input: 'speech',
        action: '/process_voice',
        speechTimeout: 'auto'
    });

    res.type('text/xml').send(twiml.toString());
});

// ====================
// 2️⃣ Process Voice Input
// ====================
app.post('/process_voice', async (req, res) => {
    const transcript = req.body.SpeechResult || 'I want a haircut tomorrow at 3pm';
    console.log('Caller said:', transcript);

    const intentData = await parseCustomerRequest(transcript);
    console.log('Parsed intent:', intentData);

    const twiml = new twilio.twiml.VoiceResponse();

    if (intentData.intent === 'book') {
        const service = intentData.service || 'haircut';
        const dateTimeStr = intentData.date_time || 'unspecified time';
        twiml.say(`Got it! You want a ${service} at ${dateTimeStr}.`, { voice: 'alice' });
        twiml.say('We would normally check availability and confirm your booking.', { voice: 'alice' });
    } else if (intentData.intent === 'cancel') {
        twiml.say('Okay, we would cancel your appointment. Please provide your confirmation code via SMS.', { voice: 'alice' });
    } else {
        twiml.say("Sorry, I didn't understand. Can you please repeat?", { voice: 'alice' });
    }

    res.type('text/xml').send(twiml.toString());
});

// ====================
// Start Server
// ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
