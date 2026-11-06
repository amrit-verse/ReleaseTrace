import crypto from "crypto";

export interface SignatureVerificationResult {
  isValid: boolean;
  valid?: boolean;
  reason?: string;
}

export interface SignPayloadOptions {
  payload: string;
  secret: string;
  timestamp?: string;
}

export interface SignPayloadResult {
  signature: string;
  timestamp: string;
  headerValue: string;
}

export interface VerifySignatureOptions {
  rawPayload: string;
  signatureHeader?: string | null;
  timestampHeader?: string | null;
  secret: string;
  maxTimeDriftSeconds?: number;
  maxFutureSkewSeconds?: number;
}

/**
 * Signs a payload with an HMAC-SHA256 signature and timestamp.
 */
export function signPayload(options: SignPayloadOptions): SignPayloadResult {
  const timestamp = options.timestamp || new Date().toISOString();
  const rawPayload = options.payload;
  const hmac = crypto.createHmac("sha256", options.secret);
  hmac.update(rawPayload);
  const signature = hmac.digest("hex");
  const headerValue = `sha256=${signature}`;

  return {
    signature,
    timestamp,
    headerValue,
  };
}

/**
 * Unified verifySignature validator checking HMAC signature and timestamp boundaries.
 */
export function verifySignature(options: VerifySignatureOptions): { valid: boolean; reason?: string } {
  const {
    rawPayload,
    signatureHeader,
    timestampHeader,
    secret,
    maxTimeDriftSeconds = 300,
    maxFutureSkewSeconds = 60,
  } = options;

  if (!signatureHeader || signatureHeader.trim().length === 0) {
    return { valid: false, reason: "Missing signature header" };
  }

  // 1. Verify HMAC
  const hmacResult = verifyHmacSha256(rawPayload, signatureHeader, secret);
  if (!hmacResult.isValid) {
    return { valid: false, reason: hmacResult.reason || "Signature mismatch" };
  }

  // 2. Verify timestamp if provided
  if (timestampHeader) {
    const timestampMs = isNaN(Number(timestampHeader))
      ? Date.parse(timestampHeader)
      : Number(timestampHeader) * (Number(timestampHeader) < 10000000000 ? 1000 : 1);

    if (isNaN(timestampMs)) {
      return { valid: false, reason: "Malformed timestamp header" };
    }

    const now = Date.now();
    const driftSeconds = (now - timestampMs) / 1000;

    // Too far in the past
    if (driftSeconds > maxTimeDriftSeconds) {
      return {
        valid: false,
        reason: `Signature expired: timestamp older than ${maxTimeDriftSeconds}s (drift: ${Math.round(driftSeconds)}s)`,
      };
    }

    // Future skew
    if (driftSeconds < -maxFutureSkewSeconds) {
      return {
        valid: false,
        reason: `Signature timestamp skewed into the future by ${Math.round(-driftSeconds)}s (max allowed: ${maxFutureSkewSeconds}s)`,
      };
    }
  }

  return { valid: true };
}

/**
 * Verifies an HMAC-SHA256 signature against the exact raw request payload bytes.
 */
export function verifyHmacSha256(
  rawBody: string | Buffer,
  signatureHeader: string | null | undefined,
  secret: string
): SignatureVerificationResult {
  if (!signatureHeader || signatureHeader.trim().length === 0) {
    return { isValid: false, valid: false, reason: "Missing signature header (X-ReleaseTrace-Signature)" };
  }

  if (!secret || secret.trim().length === 0) {
    return { isValid: false, valid: false, reason: "Webhook secret is not configured on the server" };
  }

  try {
    const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(rawBuffer);
    const expectedSignature = hmac.digest("hex");

    const cleanSignature = signatureHeader.startsWith("sha256=")
      ? signatureHeader.slice(7).trim()
      : signatureHeader.trim();

    if (cleanSignature.length !== expectedSignature.length) {
      return { isValid: false, valid: false, reason: "Signature length mismatch" };
    }

    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer = Buffer.from(cleanSignature, "hex");

    const matches = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    if (!matches) {
      return { isValid: false, valid: false, reason: "Signature mismatch" };
    }

    return { isValid: true, valid: true };
  } catch (err) {
    return {
      isValid: false,
      valid: false,
      reason: `Verification error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Validates timestamp freshness to prevent webhook replay attacks.
 */
export function verifyTimestampFreshness(
  timestampHeader: string | null | undefined,
  maxDriftSeconds: number = 300
): SignatureVerificationResult {
  if (!timestampHeader || timestampHeader.trim().length === 0) {
    return { isValid: false, valid: false, reason: "Missing timestamp header (X-ReleaseTrace-Timestamp)" };
  }

  try {
    const requestTimestamp = isNaN(Number(timestampHeader))
      ? Date.parse(timestampHeader)
      : Number(timestampHeader) * (Number(timestampHeader) < 10000000000 ? 1000 : 1);

    if (isNaN(requestTimestamp)) {
      return { isValid: false, valid: false, reason: "Malformed timestamp header" };
    }

    const currentTimestamp = Date.now();
    const driftMs = Math.abs(currentTimestamp - requestTimestamp);
    const maxDriftMs = maxDriftSeconds * 1000;

    if (driftMs > maxDriftMs) {
      return {
        isValid: false,
        valid: false,
        reason: `Timestamp expired or clock drift exceeded (${Math.round(driftMs / 1000)}s > ${maxDriftSeconds}s limit)`,
      };
    }

    return { isValid: true, valid: true };
  } catch (err) {
    return {
      isValid: false,
      valid: false,
      reason: `Timestamp parsing error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Computes an HMAC-SHA256 signature formatted as "sha256=<hex>" for outgoing signed requests.
 */
export function generateHmacSignature(rawBody: string | Buffer, secret: string): string {
  const rawBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, "utf8");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBuffer);
  return `sha256=${hmac.digest("hex")}`;
}
