const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const pino = require("pino");
const { toBuffer } = require("qrcode");
const path = require('path');
const fs = require("fs-extra");
const { Boom } = require("@hapi/boom");
const PORT = process.env.PORT || 5000;
const MESSAGE = process.env.MESSAGE || `
╭── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──╮
║ *『 😁  YOU CHOOSE IZUKU-MD 』*
║ _You complete first step to making Bot._
╰── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──╯
╭── ⋅ ⋅ ─
║  『••• 𝗩𝗶𝘀𝗶𝘁 𝗙𝗼𝗿 𝗛𝗲𝗹𝗽 •••』
║*Owner:* _https://wa.me/2347039570336_
║*GROUP 1:* _https://chat.whatsapp.com/HxVuy25MtqoFOsYuyxBx0G_
║*Group 2:* _https://chat.whatsapp.com/FdbSxW6Gr4zI4Phe846r2Q_
║ *Note :*_Don't provide your SESSION_ID to_
║ _anyone otherwise that can access chats_
╰── ⋅ ⋅ ── ✩ ── ⋅ ⋅ ──╯
`;

if (fs.existsSync('./auth_info_baileys')) {
    fs.emptyDirSync(__dirname + '/auth_info_baileys');
}

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

wss.on('connection', (ws) => {
    console.log('Client connected');

    async function IZUKU() {
        const { default: IzukuWASocket, useMultiFileAuthState, Browsers, delay, DisconnectReason, makeInMemoryStore } = require("@whiskeysockets/baileys");
        const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) });
        
        const { state, saveCreds } = await useMultiFileAuthState(__dirname + '/auth_info_baileys');
        try {
            let cnd = IzukuWASocket({
                printQRInTerminal: false,
                logger: pino({ level: "silent" }),
                browser: Browsers.macOS("Desktop"),
                auth: state
            });

            cnd.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect, qr } = s;

                if (qr) { 
                    const qrBuffer = await toBuffer(qr);
                    const qrCode = qrBuffer.toString('base64');
                    ws.send(JSON.stringify({ type: 'qr', data: qrCode }));
                    console.log("QR Code generated, please scan to connect.");
                }

                if (connection === "connecting") {
                    ws.send(JSON.stringify({ type: 'status', data: "Connecting to WhatsApp..." }));
                    console.log("Connecting to WhatsApp...");
                }

if (connection == "open") {
    await delay(3000);
    let user = cnd.user.id;

    let CREDS = fs.readFileSync(__dirname + '/auth_info_baileys/creds.json');
    var Scan_Id = Buffer.from(CREDS).toString('base64');
    console.log(`
====================  SESSION ID  ==========================                   
SESSION-ID ==> ${Scan_Id}
-------------------   SESSION CLOSED   -----------------------
`);
    ws.send(JSON.stringify({ type: 'session', data: Scan_Id })); // Send session ID as a separate message

    let msgsss = await cnd.sendMessage(user, { text: `IZUKU;;; ${Scan_Id}` });
                    await cnd.sendMessage(user, { text: MESSAGE }, { quoted: msgsss });
                    await delay(1000);
    try {
        await fs.emptyDirSync(__dirname + '/auth_info_baileys');
    } catch (e) {
        console.log(e);
    }
}

                cnd.ev.on('creds.update', saveCreds);

                if (connection === "close") {
                    let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
                    if (reason === DisconnectReason.connectionClosed) {
                        console.log("Connection closed!");
                    } else if (reason === DisconnectReason.connectionLost) {
                        console.log("Connection Lost from Server!");
                    } else if (reason === DisconnectReason.restartRequired) {
                        console.log("Restart Required, Restarting...");
                        IZUKU().catch(err => console.log(err));
                    } else if (reason === DisconnectReason.timedOut) {
                        console.log("Connection TimedOut!");
                    } else {
                        console.log('Connection closed with bot. Please run again.');
                        console.log(reason);
                    }
                }
            });
        } catch (err) {
            console.log(err);
            await fs.emptyDirSync(__dirname + '/auth_info_baileys');
        }
    }

    IZUKU().catch(async (err) => {
        console.log(err);
        await fs.emptyDirSync(__dirname + '/auth_info_baileys');
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

server.listen(PORT, () => console.log(`App listening on http://localhost:${PORT}`));
