const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const signaturesDir = path.join(__dirname, 'signatures');
if (!fs.existsSync(signaturesDir)) {
    fs.mkdirSync(signaturesDir, { recursive: true });
}

app.post('/save-signature', (req, res) => {
    const { padId, signatureData } = req.body;
    if (!padId || !signatureData) {
        return res.status(400).send('Missing padId or signatureData');
    }

    const filePath = path.join(signaturesDir, `${padId}.json`);
    fs.writeFile(filePath, JSON.stringify(signatureData), (err) => {
        if (err) {
            console.error(`Error saving signature: ${err}`);
            return res.status(500).send('Failed to save the signature');
        }
        res.send('Signature saved successfully');
    });
});

app.get('/get-signature/:padId', (req, res) => {
    const padId = req.params.padId;
    const filePath = path.join(signaturesDir, `${padId}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading signature: ${err}`);
            return res.status(404).send('Signature not found');
        }
        res.json(JSON.parse(data));
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
