import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

export interface RawPayload {
	version: string;
	created_at: string;
	id: string;
	type: string;
	amount_raw: number;
	cut: number;
	donator_name: string;
	donator_email: string;
	message: string;
}

export interface Payload {
	version: string;
	createdAt: string;
	id: string;
	type: string;
	amountRaw: number;
	cut: number;
	donatorName: string;
	donatorEmail: string;
	message: string;
}

export interface Options {
	camelCase: boolean;
}

const HEADER_NAME = "Saweria-Callback-Signature" as const;
const HMAC_PAYLOAD_KEYS = ["version", "id", "amount_raw", "donator_name", "donator_email"] as const;

export const verifySignature = (receivedSignature: string, dataString: string, key: string) => {
	const hmac = crypto.createHmac("sha256", key).update(dataString).digest("hex");
	try {
		return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(receivedSignature));
	} catch {
		return false;
	}
};

export const parsePayloadToHmacData = (payload: RawPayload): string => {
	return HMAC_PAYLOAD_KEYS.map((k) => payload[k]).join("");
};

export const camelizeRawPayload = (payload: RawPayload): Payload => {
	const { amount_raw, donator_email, donator_name, created_at, ...d } = payload;
	return {
		...d,
		createdAt: created_at,
		amountRaw: amount_raw,
		donatorEmail: donator_email,
		donatorName: donator_name,
	};
};

export const createMiddleware = (streamKey: string, options?: Partial<Options>) => {
	return (req: Request, res: Response, next: NextFunction) => {
		const receivedHmac = req.header(HEADER_NAME);
		if (!receivedHmac) return res.sendStatus(401);

		const hmacData = parsePayloadToHmacData(req.body);

		const valid = verifySignature(receivedHmac, hmacData, streamKey);
		if (!valid) return res.sendStatus(403);

		if (options?.camelCase) req.body = camelizeRawPayload(req.body);

		next();
	};
};
