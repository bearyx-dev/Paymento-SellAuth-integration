// Paymento x SellAuth Integration
// Built by UXModz (https://discord.gg/em5ZU3QfBB)

import express from "express";
import fetch from "node-fetch";
import crypto from "crypto";

var app = express();
app.use(express.json());

var PAYMENTO_KEY = process.env.PAYMENTO_API_KEY;
var PAYMENTO_SECRET = process.env.PAYMENTO_SECRET_KEY;
var SELLAUTH_KEY = process.env.SELLAUTH_API_KEY;
var SELLAUTH_SHOP_ID = process.env.SELLAUTH_SHOP_ID;
var DOMAIN = process.env.DOMAIN;

app.get("/", function(req, res) {
  res.send("Paymento x SellAuth Integration by UXModz");
});

app.get("/pay/:invoiceId", async function(req, res) {
  var invoiceId = req.params.invoiceId;
  console.log("Payment request for invoice:", invoiceId);

  try {
    var invoiceRes = await fetch(
      "https://api.sellauth.com/v1/shops/" + SELLAUTH_SHOP_ID + "/invoices/" + invoiceId,
      {
        headers: {
          "Authorization": "Bearer " + SELLAUTH_KEY,
          "Accept": "application/json"
        }
      }
    );

    if (!invoiceRes.ok) {
      console.error("SellAuth invoice fetch failed:", invoiceRes.status);
      return res.status(400).send("Invoice not found");
    }

    var invoice = await invoiceRes.json();
    var amount = invoice.price || invoice.total || invoice.amount;
    var currency = invoice.currency || "USD";

    if (!amount || parseFloat(amount) <= 0) {
      console.error("Invalid invoice amount:", amount);
      return res.status(400).send("Invalid invoice amount");
    }

    var finalAmount = parseFloat(amount).toFixed(2);
    console.log("Creating payment: invoice=" + invoiceId + " amount=" + finalAmount + " " + currency);

    var response = await fetch("https://api.paymento.io/v1/payment/request", {
      method: "POST",
      headers: {
        "Api-key": PAYMENTO_KEY,
        "Content-Type": "application/json",
        "Accept": "text/plain"
      },
      body: JSON.stringify({
        fiatAmount: finalAmount,
        fiatCurrency: currency,
        orderId: "SA_" + (invoice.id || invoiceId),
        ReturnUrl: DOMAIN + "/payment-complete",
        Speed: 0
      })
    });

    var text = await response.text();
    var data;

    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Invalid Paymento response:", text);
      return res.status(500).send("Payment gateway error");
    }

    if (!data.success || !data.body) {
      console.error("Paymento error:", JSON.stringify(data));
      return res.status(500).send(data.message || "Payment request failed");
    }

    var token = data.body.trim();
    res.redirect("https://app.paymento.io/gateway?token=" + token);

  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).send("Something went wrong");
  }
});

app.get("/payment-complete", function(req, res) {
  res.send('<html><head><title>Payment Complete</title></head><body style="background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;"><h1>Payment Received</h1><p>Your order is being processed. You will receive your product shortly.</p></div></body></html>');
});

app.post("/paymento-webhook", async function(req, res) {
  var signature = req.headers["x-hmac-sha256-signature"];
  var payload = JSON.stringify(req.body);

  if (PAYMENTO_SECRET && signature) {
    var expected = crypto
      .createHmac("sha256", PAYMENTO_SECRET)
      .update(payload)
      .digest("hex")
      .toUpperCase();

    if (expected !== signature) {
      console.error("Invalid webhook signature");
      return res.sendStatus(403);
    }
  }

  var Token = req.body.Token;
  var OrderId = req.body.OrderId;
  var OrderStatus = req.body.OrderStatus;
  console.log("Webhook received: OrderId=" + OrderId + " Status=" + OrderStatus);

  if (OrderStatus === 7 || OrderStatus === 8) {
    try {
      var verifyRes = await fetch("https://api.paymento.io/v1/payment/verify", {
        method: "POST",
        headers: {
          "Api-key": PAYMENTO_KEY,
          "Content-Type": "application/json",
          "Accept": "text/plain"
        },
        body: JSON.stringify({ token: Token })
      });

      var verifyData = await verifyRes.json();

      if (!verifyData.success) {
        console.error("Payment verification failed:", verifyData);
        return res.sendStatus(400);
      }

      var invoiceId = OrderId.replace("SA_", "");

      var processRes = await fetch(
        "https://api.sellauth.com/v1/shops/" + SELLAUTH_SHOP_ID + "/invoices/" + invoiceId + "/process",
        {
          headers: {
            "Authorization": "Bearer " + SELLAUTH_KEY,
            "Accept": "application/json"
          }
        }
      );

      if (processRes.ok) {
        console.log("Order completed:", invoiceId);
      } else {
        var errText = await processRes.text();
        console.error("Order completion failed:", processRes.status, errText);
      }

    } catch (err) {
      console.error("Webhook error:", err);
    }
  }

  res.sendStatus(200);
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function() { console.log("Running on port " + PORT); });
