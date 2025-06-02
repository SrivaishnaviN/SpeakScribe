const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the 'public' directory (or root if your files are there)
// Assuming your index.html, style.css, and script.js are in the root alongside server.js
app.use(express.static(path.join(__dirname, '.'))); 

// Optional: If you want to explicitly serve index.html on the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// (Optional) Endpoint to download text - This is handled client-side in the current script.js
// If server-side download is strictly needed, this can be implemented.
/*
app.post('/download-text', express.text(), (req, res) => {
    const textContent = req.body;
    if (!textContent || textContent.trim() === '') {
        return res.status(400).send('No text content provided.');
    }
    res.setHeader('Content-disposition', 'attachment; filename=transcribed_text.txt');
    res.setHeader('Content-type', 'text/plain');
    res.charset = 'UTF-8';
    res.write(textContent);
    res.end();
});
*/

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 