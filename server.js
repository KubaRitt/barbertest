require("dotenv").config();
const express = require("express");
const fs = require("fs");
const axios = require("axios");
const { transcribeAudio, getAIResponse, textToSpeech } = require("./aiHandler");

const app = express();
app.use(express.json({ limit: "50mb" }));

const PORT = process.env.PORT || 3000;
const VOIPVOIP_API_KEY = process.env.VOIPVOIP_API_KEY;
const VOIPVOIP_API_SECRET = process.env.VOIPVOIP_API_SECRET;

// Webhook endpoint for incoming VoIPVoIP calls
app.post("/webhook", async (req, res) => {
  try {
    const { call_id, audio_url } = req.body;

    // Download caller audio
    const audioFile = `caller_${call_id}.wav`;
    const writer = fs.createWriteStream(audioFile);
    const response = await axios({ url: audio_url, method: "GET", responseType: "stream" });
    response.data.pipe(writer);

    writer.on("finish", async () => {
      console.log("Audio downloaded, transcribing...");
      const text = await transcribeAudio(audioFile);
      console.log("Caller said:", text);

      const aiResponse = await getAIResponse(text);
      console.log("AI response:", aiResponse);

      const replyFile = `reply_${call_id}.wav`;
      await textToSpeech(aiResponse, replyFile);

      // Send reply back via VoIPVoIP API
      await axios.post(
        `https://api.voipvoip.com/v1/call/${call_id}/play`,
        fs.createReadStream(replyFile),
        {
          auth: { username: VOIPVOIP_API_KEY, password: VOIPVOIP_API_SECRET },
          headers: { "Content-Type": "audio/wav" },
        }
      );

      fs.unlinkSync(audioFile);
      fs.unlinkSync(replyFile);

      res.sendStatus(200);
    });

    writer.on("error", (err) => {
      console.error(err);
      res.sendStatus(500);
    });
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
