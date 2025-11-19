require("dotenv").config();
const SIP = require("sip.js");
const fs = require("fs");
const { spawn } = require("child_process");
const { transcribeAudio, getAIResponse, textToSpeech } = require("./aiHandler");

// Zadarma SIP credentials
const SIP_URI = "sip:313914@sip.zadarma.com";
const SIP_PASSWORD = process.env.SIP_PASSWORD;
const SIP_SERVER = "sip.zadarma.com";

// Configure UserAgent
const userAgent = new SIP.UA({
  uri: SIP_URI,
  transportOptions: {
    wsServers: [`wss://${SIP_SERVER}`], // sip.js requires WebSocket transport
  },
  authorizationUser: "313914",
  password: SIP_PASSWORD,
});

// Listen for incoming calls
userAgent.on("invite", (session) => {
  console.log("Incoming call...");
  session.accept();

  const callerAudio = "caller.wav";
  const replyAudio = "reply.wav";

  console.log("Recording caller audio for 5 seconds...");

  // Record audio from mic (simple approach)
  const record = spawn("arecord", ["-f", "cd", "-d", "5", callerAudio]);
  record.on("exit", async () => {
    console.log("Audio recorded, transcribing...");
    const text = await transcribeAudio(callerAudio);
    console.log("Caller said:", text);

    const aiResponse = await getAIResponse(text);
    console.log("AI response:", aiResponse);

    await textToSpeech(aiResponse, replyAudio);
    console.log("Playing reply...");

    spawn("aplay", [replyAudio]);

    // End call after reply
    setTimeout(() => session.bye(), 1000);
  });
});
