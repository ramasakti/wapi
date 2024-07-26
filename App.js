const qrcode = require('qrcode-terminal');
const response = require('./Response');
const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');

const app = express();

const createClient = (sessionId) => {
    return new Client({
        authStrategy: new LocalAuth({ clientId: sessionId }), // Use unique clientId for each device
        webVersion: "2.3000.1012972578-alpha",
        webVersionCache: {
            type: "remote",
            remotePath:
                "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html",
        },
        puppeteer: {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
    });
};

const clients = {};

app.listen(8080, () => {
    console.log('Server is running on port 8080'); // Log to ensure server is running

    app.get('/register/:sessionId', async (req, res) => {
        const sessionId = req.params.sessionId;
        
        if (clients[sessionId]) {
            console.log(`Session ${sessionId} already exists`);
            return response(200, clients.qr, `Session ${sessionId} already exists`, res);
        }

        console.log(`Registering session ${sessionId}`);
        const client = createClient(sessionId);
        clients[sessionId] = client;

        client.initialize();

        client.on('qr', (qr) => {
            // qrcode.generate(qr, { small: true });
            console.log(`QR Code for session ${sessionId} generated`);
            return response(200, qr, `QR Code for session ${sessionId}`, res);
        });

        client.on('ready', () => {
            console.log(`The bot for session ${sessionId} is ready`);
            return response(200, {}, `Session ${sessionId} registered and ready`, res);
        });

        client.on('authenticated', () => {
            console.log(`Authenticated for session ${sessionId}`);
        });

        client.on('auth_failure', (msg) => {
            console.error(`Auth failure for session ${sessionId}:`, msg);
            delete clients[sessionId];
            return response(500, null, `Authentication failed for session ${sessionId}`, res);
        });

        client.on('disconnected', (reason) => {
            console.log(`Client for session ${sessionId} disconnected:`, reason);
            delete clients[sessionId];
        });
    });

    app.get('/send/:sessionId/:target', async (req, res) => {
        try {
            const sessionId = req.params.sessionId;
            const target = req.params.target;
            const message = req.query.message;

            const client = clients[sessionId];

            if (!client) {
                console.log(`Session ${sessionId} not found`);
                return response(400, null, `Session not found`, res);
            }

            // Validate target phone number
            if (!/^\d+$/.test(target)) {
                throw new Error('Invalid phone number format');
            }

            // Add country code if missing
            const formattedTarget = target.startsWith('62') ? target : `62${target}`;

            await client.sendMessage(formattedTarget + '@c.us', message);
            console.log(`Message sent to ${formattedTarget} from session ${sessionId}`);
            return response(200, {}, `Message sent`, res);
        } catch (error) {
            console.error(error);
            return response(500, null, `Failed to send message`, res);
        }
    });
});