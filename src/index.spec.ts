/* eslint-disable @typescript-eslint/no-empty-function */
import { parsePayloadToHmacData, createMiddleware } from ".";
import { createHmac } from "crypto";
import type { Request, Response, Express } from "express";

const generateHmac = (data: string, secret: string) => {
	return createHmac("sha256", secret).update(data).digest("hex");
};

const SECRET = "secret";
const RAW_PAYLOAD = {
	version: "2021.07",
	created_at: "2021-01-01T12:00:00+00:00",
	id: "00000000-0000-0000-0000-000000000000",
	type: "donation",
	amount_raw: 69420,
	cut: 3471,
	donator_name: "Someguy",
	donator_email: "someguy@example.com",
	message: "THIS IS A FAKE MESSAGE! HAVE A GOOD ONE",
};

describe("middleware", () => {
	let middleware: ReturnType<typeof createMiddleware>;

	beforeEach(() => (middleware = createMiddleware(SECRET)));

	it.skip("should have a valid type", () => {
		const app = {} as Express;
		app.use(middleware);
		app.post("/webhook", middleware, () => {});
	});

	it("should verify", () => {
		const headers: Record<string, string> = {
			"Saweria-Callback-Signature": generateHmac(parsePayloadToHmacData(RAW_PAYLOAD), SECRET),
		};

		const req = <Request>{
			body: RAW_PAYLOAD,
			header: (name: string) => headers[name],
		};
		const res = <Response>{};
		const next = jest.fn();

		middleware(req, res, next);

		expect(next).toBeCalled();
		expect(req.body).toMatchObject(RAW_PAYLOAD);
	});

	it("should send status 401", () => {
		const headers: Record<string, string> = {};
		const sendStatus = jest.fn() as (status: number) => void;

		const req = <Request>{
			body: RAW_PAYLOAD,
			header: (name: string) => headers[name],
		};
		const res = <Response>{ sendStatus };
		const next = jest.fn();

		middleware(req, res, next);

		expect(sendStatus).toBeCalledWith(401);
	});

	it("should send status 403", () => {
		const headers: Record<string, string> = {
			"Saweria-Callback-Signature": "invalid",
		};
		const sendStatus = jest.fn() as (status: number) => void;

		const req = <Request>{
			body: RAW_PAYLOAD,
			header: (name: string) => headers[name],
		};
		const res = <Response>{ sendStatus };
		const next = jest.fn();

		middleware(req, res, next);

		expect(sendStatus).toBeCalledWith(403);
	});

	it("should parse to camel case", () => {
		const middleware = createMiddleware(SECRET, { camelCase: true });
		const headers: Record<string, string> = {
			"Saweria-Callback-Signature": generateHmac(parsePayloadToHmacData(RAW_PAYLOAD), SECRET),
		};

		const req = <Request>{
			body: RAW_PAYLOAD,
			header: (name: string) => headers[name],
		};
		const res = <Response>{};
		const next = jest.fn();

		middleware(req, res, next);

		expect(next).toBeCalled();
		expect(req.body).toMatchObject({
			version: "2021.07",
			createdAt: "2021-01-01T12:00:00+00:00",
			id: "00000000-0000-0000-0000-000000000000",
			type: "donation",
			amountRaw: 69420,
			cut: 3471,
			donatorName: "Someguy",
			donatorEmail: "someguy@example.com",
			message: "THIS IS A FAKE MESSAGE! HAVE A GOOD ONE",
		});
	});
});
