import express from 'express';
import fetch from 'node-fetch';
import path from 'path';

const app = express();
const PORT = 3000;
const API_KEY = 'fca_live_2t1pdY3EcETNlWJgR7LWna8BeBESsEZFQM3PGgpY'; 

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


app.get('/api/convert', async (req, res) => {
    const { amount, base, to } = req.query;

    if (!amount || !base || !to) {
        console.error('Missing parameters:', { amount, base, to });
        return res.status(400).json({ error: 'Missing required parameters: amount, base, to' });
    }

    try {
        const response = await fetch(`https://api.freecurrencyapi.com/v1/latest?apikey=${API_KEY}&base_currency=${base}&currencies=${to}`);
        const data = await response.json();

        if (!data.data) {
            console.error('Invalid response from currency API:', data);
            return res.status(400).json({ error: 'Invalid response from currency API' });
        }

        const rates = {};
        to.split(',').forEach(currency => {
            const rate = parseFloat(data.data[currency]); 
            if (!isNaN(rate)) {
                rates[currency] = (amount * rate).toFixed(2); 
            } else {
                console.warn(`No rate found for currency: ${currency}`);
            }
        });

        res.json({ data: rates });
    } catch (error) {
        console.error('Error fetching exchange rate:', error);
        res.status(500).json({ error: 'Failed to fetch exchange rate' });
    }
});


app.get('/api/historical', async (req, res) => {
    const { base, to, date } = req.query;

    if (!base || !to || !date) {
        console.error('Missing parameters:', { base, to, date });
        return res.status(400).json({ error: 'Missing required parameters: base, to, date' });
    }

    try {
        const response = await fetch(`https://api.freecurrencyapi.com/v1/historical?apikey=${API_KEY}&date=${date}&base_currency=${base}&currencies=${to}`);
        const data = await response.json();

        if (!data.data) {
            console.error('Invalid response from currency API:', data);
            return res.status(400).json({ error: 'Invalid response from currency API' });
        }

        res.json(data.data);
    } catch (error) {
        console.error('Error fetching historical rates:', error);
        res.status(500).json({ error: 'Failed to fetch historical rates' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});