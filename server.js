require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const apiRoutes = require('./routes/api');
const CryptoData = require('./models/CryptoData');

const app = express();

app.use(express.json());

app.use('/api', apiRoutes);

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.log('MongoDB connection error:', err));

// function for fetching data
const fetchCryptoData = async () => {
    try {
        const coins = ['bitcoin', 'matic-network', 'ethereum'];
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
            params: {
                vs_currency: 'usd',
                ids: coins.join(','),
                order: 'market_cap_desc',
                per_page: coins.length,
                page: 1,
                sparkline: false
            }
        });

        const data = response.data;

        for (let coin of data) {
            const cryptoData = new CryptoData({
                coin: coin.id,
                price: coin.current_price,
                marketCap: coin.market_cap,
                change24h: coin.price_change_percentage_24h
            });

            await cryptoData.save();
            console.log(`saved data for ${coin.id}`);
        }

    } catch (error) {
        console.error('error fetching data :', error.message);
    }
};

// fetch data when server starts
fetchCryptoData();

// fetch data every 2 hours
cron.schedule('0 */2 * * *', async () => {
    await fetchCryptoData();
});


// direct api call to fetch data (testing purpose)
app.get('/api/fetch-data', async (req, res) => {
  try {
    const coins = ['bitcoin', 'matic-network', 'ethereum'];
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        ids: coins.join(','),
        order: 'market_cap_desc',
        per_page: coins.length,
        page: 1,
        sparkline: false
      }
    });

    const data = response.data;

    for (let coin of data) {
      const cryptoData = new CryptoData({
        coin: coin.id,
        price: coin.current_price,
        marketCap: coin.market_cap,
        change24h: coin.price_change_percentage_24h
      });

      await cryptoData.save();
      console.log(`saved data for ${coin.id}`);
    }

    res.json({ message: 'data fetche and stored successfully.' });
  } catch (error) {
    console.error('error fetching data :', error.message);
    res.status(500).json({ error: 'Failed to fetch data.' });
  }
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
});
