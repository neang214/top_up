import crypto from "node:crypto";

/*
 * ABA PayWay (Ecommerce Checkout API).
 *
 * Required env vars:
 *   PAYWAY_MERCHANT_ID   merchant id from PayWay
 *   PAYWAY_API_KEY       api key from PayWay (used to sign every request)
 * Optional env vars:
 *   PAYWAY_BASE_URL      default https://checkout-sandbox.payway.com.kh (use the production URL PayWay gives you when live)
 *   PAYWAY_CALLBACK_URL  public https URL of POST /api/payments/payway/callback so PayWay can tell us a payment finished
 *   PAYWAY_LIFETIME_MIN  how long a QR stays payable, in minutes (default 10, minimum 3)
 *   PAYWAY_PAYMENT_GATE  set to 0 only if your PayWay profile also has the "QR Payment API" service
 */

const getConfig = () => {
    const merchantId = process.env.PAYWAY_MERCHANT_ID;
    const apiKey = process.env.PAYWAY_API_KEY;

    if (!merchantId || !apiKey) {
        throw new Error("PAYWAY_MERCHANT_ID and PAYWAY_API_KEY must be set to use ABA PayWay");
    }

    const lifetime = Number(process.env.PAYWAY_LIFETIME_MIN ?? 10);

    return {
        merchantId,
        apiKey,
        baseUrl: (process.env.PAYWAY_BASE_URL ?? "https://checkout-sandbox.payway.com.kh").replace(/\/+$/, ""),
        callbackUrl: process.env.PAYWAY_CALLBACK_URL,
        paymentGate: process.env.PAYWAY_PAYMENT_GATE,
        lifetimeMin: Number.isFinite(lifetime) && lifetime >= 3 ? Math.floor(lifetime) : 10,
    };
};

const base64 = (text: string) => Buffer.from(text, "utf8").toString("base64");

/** Base64 of HMAC-SHA512, the signature PayWay expects on every request. */
const sign = (data: string, apiKey: string) => crypto.createHmac("sha512", apiKey).update(data).digest("base64");

/** UTC time as YYYYMMDDHHmmss. */
const requestTime = () => new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);

/** PayWay's purchase hash joins these fields in exactly this order; fields we don't send count as empty. */
const PURCHASE_HASH_ORDER = [
    "req_time",
    "merchant_id",
    "tran_id",
    "amount",
    "items",
    "shipping",
    "firstname",
    "lastname",
    "email",
    "phone",
    "type",
    "payment_option",
    "return_url",
    "cancel_url",
    "continue_success_url",
    "return_deeplink",
    "currency",
    "custom_fields",
    "return_params",
    "payout",
    "lifetime",
    "additional_params",
    "google_pay_token",
    "skip_success_page",
] as const;

/** A short unique transaction id. PayWay allows at most 20 characters. */
export const newTranId = () => `${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`.toUpperCase();

export interface PayWayPurchase {
    qrString: string;
}

export const createPurchase = async (input: {
    tranId: string;
    amount: number;
    currency: string;
    itemName: string;
}): Promise<PayWayPurchase> => {
    const cfg = getConfig();
    const isKhr = input.currency === "KHR";
    const amount = isKhr ? Math.round(input.amount).toString() : input.amount.toFixed(2);

    const fields: Record<string, string> = {
        req_time: requestTime(),
        merchant_id: cfg.merchantId,
        tran_id: input.tranId,
        amount,
        items: base64(JSON.stringify([{ name: input.itemName.slice(0, 100), quantity: 1, price: Number(amount) }])),
        // This option makes PayWay answer with JSON that contains the KHQR string. Only the QR is used.
        payment_option: "abapay_khqr_deeplink",
        currency: input.currency,
        lifetime: String(cfg.lifetimeMin),
    };

    if (cfg.callbackUrl) fields.return_url = base64(cfg.callbackUrl);

    const hash = sign(PURCHASE_HASH_ORDER.map((key) => fields[key] ?? "").join(""), cfg.apiKey);

    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    form.append("hash", hash);
    if (cfg.paymentGate !== undefined && cfg.paymentGate !== "") form.append("payment_gate", cfg.paymentGate);

    const res = await fetch(`${cfg.baseUrl}/api/payment-gateway/v1/payments/purchase`, {
        method: "POST",
        body: form,
        signal: AbortSignal.timeout(15000),
    });

    const text = await res.text();
    let data: any;
    try {
        data = JSON.parse(text);
    } catch {
        throw new Error(`PayWay purchase returned a non-JSON response (HTTP ${res.status}). Is the payment option enabled for your profile?`);
    }

    const code = String(data?.status?.code ?? "");
    if ((code !== "00" && code !== "0") || typeof data?.qr_string !== "string" || data.qr_string === "") {
        throw new Error(`PayWay purchase failed: code ${code || "unknown"} ${data?.status?.message ?? ""}`.trim());
    }

    return { qrString: data.qr_string };
};

export interface PayWayCheck {
    state: "PAID" | "PENDING" | "FAILED";
    paidAmount: number | null;
    currency: string | null;
}

/** Asks PayWay for the real status of a transaction. Never trust a callback body instead of this. */
export const checkTransaction = async (tranId: string): Promise<PayWayCheck> => {
    const cfg = getConfig();
    const reqTime = requestTime();

    const res = await fetch(`${cfg.baseUrl}/api/payment-gateway/v1/payments/check-transaction-2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            req_time: reqTime,
            merchant_id: cfg.merchantId,
            tran_id: tranId,
            hash: sign(`${reqTime}${cfg.merchantId}${tranId}`, cfg.apiKey),
        }),
        signal: AbortSignal.timeout(10000),
    });

    const data: any = await res.json();
    const code = String(data?.status?.code ?? "");

    // 6 = transaction not found (not created yet), treat as not paid
    if (code === "6") return { state: "PENDING", paidAmount: null, currency: null };

    if (code !== "00") {
        throw new Error(`PayWay check failed: code ${code || "unknown"} ${data?.status?.message ?? ""}`.trim());
    }

    const status = String(data?.data?.payment_status ?? "").toUpperCase();
    const paidAmount = Number(data?.data?.payment_amount);

    const result = {
        paidAmount: Number.isFinite(paidAmount) ? paidAmount : null,
        currency: typeof data?.data?.payment_currency === "string" ? data.data.payment_currency : null,
    };

    if (status === "APPROVED") return { state: "PAID", ...result };
    if (status === "DECLINED" || status === "CANCELLED" || status === "REFUNDED") return { state: "FAILED", ...result };
    return { state: "PENDING", ...result };
};
