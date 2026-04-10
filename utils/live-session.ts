import { createHmac } from "node:crypto";

type LiveSessionPayload = {
  uid: string;
  exp: number;
};

function encodeBase64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createLiveSessionToken(
  uid: string,
  secret: string,
  expiresInSeconds: number = 60 * 10,
) {
  const payload: LiveSessionPayload = {
    uid,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  };

  const payloadPart = encodeBase64Url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(payloadPart).digest();

  return `${payloadPart}.${encodeBase64Url(signature)}`;
}
