# Saweria Webhook Express

`saweria-webhook-express` is a simple Express middleware to verify Saweria webhook request using your stream key.

This middleware will checks whether the received request is a valid request from Saweria or not, it will:

- returns `403` if `Saweria-Callback-Signature` header isn't provided
- returns `401` if `Saweria-Callback-Signature` value isn't valid

### Install

```
npm i saweria-webhook-express
```

### Usage

```js
const express = require("express");
const { createMiddleware } = require("saweria-webhook-express");

const app = express();

const verifySignature = createMiddleware("your-stream-key");

app.use(express.json()); // required since the middleware also reads the donation payload

app.post("/webhook", verifySignature, (req, res) => {
	console.log("New verified request from Saweria!");
	console.log(req.body); // donation payload
	res.sendStatus(200);
});

app.listen(8080);
```

`createMiddleware` also accepts 2nd parameter as options:

```js
const verifySignature = createMiddleware("your-stream-key", {
	camelCase: true, // false by default
});
```

This will convert the body payload (`req.body`) from `snake_case`:

```js
{
	version: "2021.07",
	created_at: "2021-01-01T12:00:00+00:00",
	id: "00000000-0000-0000-0000-000000000000",
	type: "donation",
	amount_raw: 69420,
	cut: 3471,
	donator_name: "Someguy",
	donator_email: "someguy@example.com",
	message: "THIS IS A FAKE MESSAGE! HAVE A GOOD ONE",
}
```

to `camelCase`:

```js
{
	version: "2021.07",
	createdAt: "2021-01-01T12:00:00+00:00",
	id: "00000000-0000-0000-0000-000000000000",
	type: "donation",
	amountRaw: 69420,
	cut: 3471,
	donatorName: "Someguy",
	donatorEmail: "someguy@example.com",
	message: "THIS IS A FAKE MESSAGE! HAVE A GOOD ONE",
}
```
