require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const twilio = require('twilio');
const { parseCustomerRequest } = require('./aiConversation');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// Twilio client (only needed if sending SMS)
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// ====================
// 1️⃣ Voice webhook
// ====================
app.post('/voice', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();

    // Greeting in Czech
    twiml.say('Dobrý den! Vítejte u našeho holičství.', { voice: 'alice', language: 'cs-CZ' });

    // Gather speech input
    twiml.gather({
        input: 'speech',
        action: '/process_voice',
        speechTimeout: 'auto',
        language: 'cs-CZ'
    });

    res.type('text/xml').send(twiml.toString());
});

// ====================
// 2️⃣ Process voice input
// ====================
app.post('/process_voice', async (req, res) => {
    const transcript = req.body.SpeechResult || 'Chci si objednat střih zítra odpoledne';
    console.log('Caller said:', transcript);

    const intentData = await parseCustomerRequest(transcript);
    console.log('Parsed intent:', intentData);

    const twiml = new twilio.twiml.VoiceResponse();

    if (intentData.intent === 'book') {
        const service = intentData.service || 'střih';
        const dateTimeStr = intentData.date_time || 'neuvedený čas';
        twiml.say(`Rozumím, chcete ${service} v ${dateTimeStr}.`, { voice: 'alice', language: 'cs-CZ' });
        twiml.say('Normálně bychom zkontrolovali dostupnost a potvrdili vaši rezervaci.', { voice: 'alice', language: 'cs-CZ' });
    } else if (intentData.intent === 'cancel') {
        twiml.say('Dobře, vaši rezervaci zrušíme. Prosím, pošlete nám potvrzovací kód SMS pro zrušení.', { voice: 'alice', language: 'cs-CZ' });
    } else {
        twiml.say('Promiňte, nerozuměl jsem. Můžete to prosím zopakovat?', { voice: 'alice', language: 'cs-CZ' });
    }

    res.type('text/xml').send(twiml.toString());
});

// ====================
// Start server
// ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
