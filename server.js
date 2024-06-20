const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.json({ limit: '10mb' })); // to support JSON-encoded bodies

// Endpoint to save the signature
app.post('/save-signature', (req, res) => {
    const { padId, imgData } = req.body;
    const filePath = path.join(__dirname, `${padId}.png`);
    
    // Decode base64 image
    const base64Data = imgData.replace(/^data:image\/png;base64,/, '');
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
        if (err) {
            return res.status(500).send('Failed to save the signature');
        }
        res.send('Signature saved successfully');
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
