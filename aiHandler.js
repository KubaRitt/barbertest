const fs = require("fs");
const axios = require("axios");

// Transcribe caller audio
async function transcribeAudio(filePath) {
  const resp = await axios.post(
    "https://api.openai.com/v1/audio/transcriptions",
    fs.createReadStream(filePath),
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "multipart/form-data",
      },
      params: { model: "whisper-1" },
    }
  );
  return resp.data.text;
}

// Generate AI response
async function getAIResponse(prompt) {
  const resp = await axios.post(
    "https://api.openai.com/v1/chat/completions",
    {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
  );
  return resp.data.choices[0].message.content;
}

// Convert text to speech
async function textToSpeech(text, outputFile) {
  const resp = await axios.post(
    "https://api.openai.com/v1/audio/speech",
    { model: "gpt-4o-mini-tts", voice: "alloy", input: text },
    {
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      responseType: "arraybuffer",
    }
  );
  fs.writeFileSync(outputFile, Buffer.from(resp.data));
}

module.exports = { transcribeAudio, getAIResponse, textToSpeech };
