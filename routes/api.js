const express = require('express');
const router = express.Router();
const CryptoData = require('../models/CryptoData');
const mongoose = require('mongoose');

router.get('/stats', async (req, res) => {
    const { coin } = req.query;

    const validCoins = ['bitcoin', 'matic-network', 'ethereum'];
    if (!coin || !validCoins.includes(coin)) {
        return res.status(400).json({ error: 'Invalid or missing coin parameter. Valid options are bitcoin, matic-network, ethereum.' });
    }

    try {
        const latestData = await CryptoData.findOne({ coin }).sort({ timestamp: -1 });

        if (!latestData) {
            return res.status(404).json({ error: 'no data found for the specified coin.' });
        }

        res.json({
            price: latestData.price,
            marketCap: latestData.marketCap,
            "24hChange": latestData.change24h
        });

    } catch (error) {
        console.error('error fetching stats:', error.message);
        res.status(500).json({ error: 'internal server error.' });
    }
});

router.get('/deviation', async (req, res) => {
    const { coin } = req.query;

    const validCoins = ['bitcoin', 'matic-network', 'ethereum'];
    if (!coin || !validCoins.includes(coin)) {
        return res.status(400).json({ error: 'Invalid or missing coin parameter. Valid options are bitcoin, matic-network, ethereum.' });
    }

    try {
        const records = await CryptoData.find({ coin })
            .sort({ timestamp: -1 })
            .limit(100)
            .select('price -_id');

        if (records.length === 0) {
            return res.status(404).json({ error: 'no data found for the specified coin.' });
        }

        const prices = records.map(record => record.price);
        const mean = prices.reduce((acc, val) => acc + val, 0) / prices.length;
        const variance = prices.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / prices.length;
        const stdDeviation = Math.sqrt(variance);

        const roundedDeviation = Math.round(stdDeviation * 100) / 100;

        res.json({
            deviation: roundedDeviation
        });

    } catch (error) {
        console.error('error calculating deviation:', error.message);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

module.exports = router;
