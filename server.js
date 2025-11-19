require("dotenv").config();
const Srf = require("drachtio-srf");
const srf = new Srf();
const { spawn } = require("child_process");
const { transcribeAudio, getAIResponse, textToSpeech } = require("./aiHandler");

const SIP_USERNAME = "313914";
const SIP_PASSWORD = process.env.SIP_PASSWORD;
const SIP_SERVER = "sip.zadarma.com";

srf.connect({
  host: SIP_SERVER,
  port: 5060,
  protocol: "udp",
  localAddress: "0.0.0.0",
});

srf.on("connect", () => console.log("Connected to SIP server"));
srf.on("error", (err) => console.error(err));

srf.invite(async (req, res) => {
  console.log("Incoming call...");
  const dlg = await res.send(200);

  const callerAudio = "caller.wav";
  const replyAudio = "reply.wav";

  console.log("Recording caller audio for 5 seconds...");
  const record = spawn("arecord", ["-f", "cd", "-d", "5", callerAudio]);
  record.on("exit", async () => {
    console.log("Audio recorded. Transcribing...");
    const text = await transcribeAudio(callerAudio);
    console.log("Caller said:", text);

    const responseText = await getAIResponse(text);
    console.log("AI response:", responseText);

    await textToSpeech(responseText, replyAudio);
    console.log("Playing reply...");
    spawn("aplay", [replyAudio]);

    // End the call after 1 second
    setTimeout(() => dlg.destroy(), 1000);
  });
});
