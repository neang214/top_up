import * as khqrLib from "bakong-khqr";
import QRcode from "qrcode";

const {
    BakongKHQR: BakongKHQRClass,
    khqrData,
    IndividualInfo,
} = khqrLib as any;

const BAKONG_ACCOUNT_ID = process.env.BAKONG_ACCOUNT_ID;
const BAKONG_MERCHANT_CITY = process.env.BAKONG_MERCHANT_CITY;
const BAKONG_MERCHANT_NAME = process.env.BAKONG_MERCHANT_NAME;
const BAKONG_TOKEN = process.env.BAKONG_TOKEN;

export const createPayment = async (
    amountUsd: number,
    billNumber: string
) => {
    const info = new IndividualInfo(
        BAKONG_ACCOUNT_ID,
        BAKONG_MERCHANT_NAME,
        BAKONG_MERCHANT_CITY,
        {
            currency: khqrData.currency.usd,
            amount: amountUsd,
            billNumber,
            expirationTimestamp: Date.now() + 10 * 60 * 1000,
        }
    );

    const result = new BakongKHQRClass().generateIndividual(info);

    console.log(result.status, {
        amountUsd,
        billNumber,
    });

    if (result.status.code !== 0) {
        throw new Error(result.status.message);
    }

    const { qr, md5 } = result.data;
    const qrImage = await QRcode.toDataURL(qr);

    return {
        qr,
        md5,
        qrImage,
    };
};

export const qrToImage = async (qr: string) => {
    return QRcode.toDataURL(qr);
};

export const isPaid = async (md5: string) => {
    const res = await fetch(
        "https://api-bakong.nbc.gov.kh/v1/check_transaction_by_md5",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${BAKONG_TOKEN}`,
            },
            body: JSON.stringify({ md5 }),
        }
    );

    const data = await res.json();

    return data.responseCode === 0;
};
