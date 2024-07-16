const qrcode = require('qrcode-terminal');
const { Client, ClientOptions, LocalAuth, MessageMedia } = require('whatsapp-web.js')
const express = require('express')

const app = express();

const CLIENT_OPTIONS = {
    authStrategy: new LocalAuth(),
    webVersion: "2.3000.1012972578-alpha",
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/{version}.html",
    },
    puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
};

app.listen(8080, async () => {
    const client = new Client(CLIENT_OPTIONS);

    client.initialize();

    client.on('qr', (qr) => {
        qrcode.generate(qr, { small: true });
    });

    client.on("ready", () => {
        console.log("The bot is ready");
    });

    app.get('/send/:target', async (req, res) => {
        try {
            const target = req.params.target
            const message = req.query.message

            // Logging for debugging
            console.log(`Sending message to ${target}: ${message}`);

            // Validate target phone number
            if (!/^\d+$/.test(target)) {
                throw new Error('Invalid phone number format');
            }

            // Add country code if missing
            const formattedTarget = target.startsWith('62') ? target : `62${target}`;
    
            client.sendMessage(formattedTarget + '@c.us', message)
            res.status(200).send('Message sent');
        } catch (error) {
            console.error(error)
        }
    })
});
