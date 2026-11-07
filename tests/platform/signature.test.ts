import crypto from "crypto";
import { describe, it, expect } from "vitest";
import {
  verifyHmacSha256,
  verifyTimestampFreshness,
  generateHmacSignature,
} from "../../src/lib/security/signature";

describe("Webhook Signature & Security Verification", () => {
  const secret = "test-super-secret-key-32-chars-long";
  const rawPayload = JSON.stringify({
    eventId: "evt_101",
    provider: "github_actions",
    commitSha: "c0ffee123456",
  });

  it("successfully verifies a valid HMAC-SHA256 signature", () => {
    const signature = generateHmacSignature(rawPayload, secret);
    const result = verifyHmacSha256(rawPayload, signature, secret);
    expect(result.isValid).toBe(true);
    expect(result.reason).toBeUndefined();
  });

  it("rejects an invalid or tampered signature", () => {
    const signature = generateHmacSignature(rawPayload, secret);
    const tamperedPayload = rawPayload.replace("c0ffee", "deadbeef");
    const result = verifyHmacSha256(tamperedPayload, signature, secret);
    expect(result.isValid).toBe(false);
    expect(result.reason).toBe("Signature mismatch");
  });

  it("rejects missing signature header", () => {
    const result = verifyHmacSha256(rawPayload, null, secret);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Missing signature header");
  });

  it("verifies timestamp freshness within drift limit", () => {
    const nowIso = new Date().toISOString();
    const result = verifyTimestampFreshness(nowIso, 300);
    expect(result.isValid).toBe(true);
  });

  it("rejects expired timestamp beyond drift limit (replay attack prevention)", () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const result = verifyTimestampFreshness(tenMinutesAgo, 300);
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain("Timestamp expired");
  });

  it("successfully verifies signature with v1= prefix", () => {
    const rawSig = generateHmacSignature(rawPayload, secret).replace("sha256=", "");
    const v1Header = `t=1794026098,v1=${rawSig}`;
    const result = verifyHmacSha256(rawPayload, v1Header, secret);
    expect(result.isValid).toBe(true);
  });

  it("successfully verifies timestamp-prepended payload signature", () => {
    const ts = "1794026098";
    const tsSig = crypto.createHmac("sha256", secret).update(`${ts}.${rawPayload}`).digest("hex");
    const result = verifyHmacSha256(rawPayload, `sha256=${tsSig}`, secret, ts);
    expect(result.isValid).toBe(true);
  });
});
