import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import cors from 'cors';

import authRoute from '././modules/auth/route.js'
import gameRoute from '././modules/games/route.js'
import orderRoute from '././modules/orders/route.js';
import topUpRoute from '././modules/topups/route.js';
import paymentRoute from '././modules/payments/route.js';
import productRoute from '././modules/products/route.js';

const app = express()

const PORT = Number(process.env.PORT) || 8000;
const CLIENT_URL =
    process.env.CLIENT_URL || "http://localhost:5173";

app.use(
    express.json({
        limit: "10kb",
    })
);

app.use(
    cors({
        origin: CLIENT_URL,
        credentials: true,
    })
);
app.use(cookieParser());


app.use('/api', productRoute);
app.use('/api/auth', authRoute);
app.use('/api/games', gameRoute);
app.use("/api/topups", topUpRoute);
app.use('/api/orders', orderRoute);
app.use('/api/payments', paymentRoute);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
