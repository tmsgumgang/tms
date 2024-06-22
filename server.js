const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' })); // to support JSON-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // serve static files from 'public' directory

// Ensure the signatures directory exists
const signaturesDir = path.join(__dirname, 'signatures');
if (!fs.existsSync(signaturesDir)) {
    fs.mkdirSync(signaturesDir, { recursive: true });
}

// Endpoint to save the signature
app.post('/save-signature', (req, res) => {
    const { padId, imgData } = req.body;
    if (!padId || !imgData) {
        return res.status(400).send('Missing padId or imgData');
    }
    
    const filePath = path.join(signaturesDir, `${padId}.png`);

    // Decode base64 image
    const base64Data = imgData.replace(/^data:image\/png;base64,/, '');
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            console.error(`Error saving signature: ${err}`);
            return res.status(500).send('Failed to save the signature');
        }
        res.send('Signature saved successfully');
    });
});

// Endpoint to get the signature
app.get('/get-signature/:padId', (req, res) => {
    const padId = req.params.padId;
    const filePath = path.join(signaturesDir, `${padId}.png`);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            console.error(`Error reading signature: ${err}`);
            return res.status(404).send('Signature not found');
        }
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(data);
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
