# Paymento x SellAuth Integration

**Built by [UXModz](https://discord.gg/em5ZU3QfBB)** | [Join Us!](https://discord.gg/em5ZU3QfBB)

Accept crypto payments on your SellAuth shop using Paymento. Fully automatic. No manual work. Customer pays, product gets delivered.

---

## Why Paymento

Supported currencies:
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- Tron (TRX)
- USDT (ERC20 / TRC20)
- USDC (multi-chain)

**NO KYC. NO BANKS. NO ONE FREEZING YOUR MONEY.**

No middleman. No approval. No "your funds are under review" nonsense.

Every payment goes straight to your wallet, instantly.

You control the wallet. You control the money. You control everything.

Use this if you are done with:
- KYC
- Random account freezes
- Insane fees
- Begging platforms for your own money

---

## How It Works

The full payment flow, step by step:

1. A customer visits your SellAuth shop and picks a product.
2. They select your Paymento payment method at checkout.
3. SellAuth creates a pending invoice and redirects the customer to your server.
4. Your server fetches the invoice details (price, currency) from the SellAuth API.
5. Your server creates a payment request with Paymento using that price.
6. The customer gets redirected to the Paymento checkout page to pay with crypto.
7. The customer pays. Paymento confirms the transaction.
8. Paymento sends a webhook (IPN) to your server with the payment status.
9. Your server verifies the payment with Paymento to make sure it is real.
10. Your server tells SellAuth to process the invoice and mark it as completed.
11. SellAuth delivers the product to the customer automatically.

The entire flow is automatic after setup. No manual confirmation needed.

---

## Requirements

- A [SellAuth](https://sellauth.com) account with a shop (Business Plan required to create MANUAL payment methods)
- A [Paymento](https://paymento.io) merchant account
- A hosting provider that supports Node.js. We recommend [Railway](https://railway.app). We built and tested this with Railway. Other providers like Render or a VPS will probably work too, but we have not tested them.

---

## Hosting

Railway offers a free trial for about 14 days so you can test everything without paying. After that, we recommend the **Hobby plan** ($5/month). On the free tier, your server will go to sleep after inactivity. If a customer tries to pay while your server is asleep, the payment will not go through. The $5 Hobby plan keeps your server running 24/7 so you never miss a payment.

---

## Setup

### 1. Fork This Repository

Click the **Fork** button at the top right of this page. This gives you your own copy to deploy.

### 2. Deploy to Railway

- Create a new project on [Railway](https://railway.app) and connect your forked GitHub repository.
- Railway will detect the `package.json` and deploy it automatically.

### 3. Generate a Domain on Railway

Your server needs a public URL so SellAuth and Paymento can reach it.

1. In your Railway project, click on your service.
2. Go to **Settings > Networking**.
3. Scroll down and click **Generate Domain**.
4. Railway will give you a URL like `https://your-app-name.up.railway.app`.
5. Copy this URL. You will need it for the next steps.

### 4. Set Environment Variables

In your Railway project, go to **Variables** and add these five:

| Variable | Description |
|---|---|
| `PAYMENTO_API_KEY` | Your Paymento API key. Found in your Paymento dashboard under API settings. |
| `PAYMENTO_SECRET_KEY` | Your Paymento secret key. Used to verify webhook signatures. Found in the same place as the API key. |
| `SELLAUTH_API_KEY` | Your SellAuth API key. Found at **Dashboard > Account > API Access**. Click Regenerate if you do not see it. |
| `SELLAUTH_SHOP_ID` | Your SellAuth shop ID. Found on the same API Access page. |
| `DOMAIN` | The domain you just generated in step 3. Example: `https://your-app-name.up.railway.app` (no trailing slash). |

### 5. Configure Paymento IPN

In your Paymento dashboard:

1. Go to **Settings > IPN URL**.
2. Set the IPN Notification URL to:
   ```
   https://your-domain.com/paymento-webhook
   ```
   Replace `your-domain.com` with the Railway domain you generated in step 3.
3. Click **Save Changes**.

This tells Paymento where to send payment confirmations.

### 6. Configure SellAuth Payment Method

In your SellAuth dashboard:

1. Go to **Payment Methods** and create a new one.
2. Set the type to **MANUAL**.
3. Give it a name like "Crypto (SOL, ETH, BTC)" or whatever you prefer.
4. Set the **Redirect URL** to:
   ```
   https://your-domain.com/pay/{unique_id}
   ```
   Replace `your-domain.com` with the Railway domain you generated in step 3.
5. Save the payment method.

The `{unique_id}` variable is provided by SellAuth. It gets replaced with the actual invoice ID when a customer checks out.

**Allowed SellAuth variables for the redirect URL:** `{id}`, `{unique_id}`, `{email}`, `{price}`, `{currency}`, `{price_usd}`

### 7. Test It

1. Go to your SellAuth shop and add a product to cart.
2. Select your new Paymento payment method.
3. You should get redirected to the Paymento checkout page with the correct amount.
4. Complete a small test payment to verify the full flow works end to end.

---

## Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | Health check. Returns server status. |
| `/pay/:invoiceId` | GET | Fetches invoice from SellAuth, creates Paymento payment, redirects customer to pay. |
| `/payment-complete` | GET | Confirmation page shown to customer after paying. |
| `/paymento-webhook` | POST | Receives payment notifications from Paymento, verifies payment, completes the SellAuth order. |

---

## Security

- **Webhook signature verification**: Every incoming Paymento webhook is verified using HMAC-SHA256 with your secret key. Fake requests get rejected.
- **Payment verification**: After receiving a webhook, the server double-checks the payment with Paymento's verify endpoint before completing anything.
- **No hardcoded credentials**: All API keys and secrets are loaded from environment variables. Nothing sensitive is in the code.

---

## Disclaimer

This integration was built, tested, and confirmed working in production by UXModz. That said:

**We are not responsible for any payments not coming through, failed transactions, lost funds, or any financial issues that may occur while using this script.** This worked for us. We tested it. It is live. But we do not guarantee anything for your setup. Use it at your own risk.

Make sure you understand what you are deploying. Test everything with small amounts first. Set up your environment variables correctly. If something is not working, check your logs before opening an issue.

> ***If you do not know what you are doing, do not use this. Read the instructions. Follow the steps. Do not skip anything. We are not responsible for your mistakes.***

---

## Credits

Built by **[UXModz](https://discord.gg/em5ZU3QfBB)**. Big love to my design studio.

If this helped you out, drop a star on the repo and come say hi on [Discord](https://discord.gg/em5ZU3QfBB).

---

## License

MIT License. See [LICENSE](LICENSE) for details.
