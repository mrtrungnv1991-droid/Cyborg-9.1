// ==============================================================================
// INDEPENDENT PAYMENT / TOP-UP SYSTEM - SECURITY & REDACTION
// Conforms strictly to Sections 27, 28, 49 of Payment Specification
// ==============================================================================

import crypto from 'crypto';

const ENCRYPTION_SECRET = process.env.ENCRYPTION_KEY || 'cyberpool-payment-vault-secret-key-32b-min!';
// Ensure exactly 32 bytes for aes-256-cbc / gcm
const KEY_BUFFER = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

/**
 * Encrypt sensitive credentials (e.g. API keys, session tokens, passwords).
 * Never store plaintext passwords/credentials in the database or store.
 */
export function encryptCredential(plaintext: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY_BUFFER, iv);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    return `enc_${crypto.createHash('sha256').update(plaintext).digest('hex').substring(0, 16)}`;
  }
}

/**
 * Decrypt sensitive credentials inside isolated worker memory only.
 */
export function decryptCredential(encryptedText: string): string {
  try {
    if (!encryptedText.includes(':')) {
      return '[ENCRYPTED_OPAQUE]';
    }
    const [ivHex, dataHex] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', KEY_BUFFER, iv);
    let decrypted = decipher.update(dataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '[DECRYPTION_FAILED]';
  }
}

/**
 * Redact sensitive fields from any string, payload or log object.
 * Rule 28: password=[REDACTED], token=[REDACTED], cookie=[REDACTED]
 */
export function redactSensitive(data: any): any {
  if (!data) return data;

  if (typeof data === 'string') {
    return data
      .replace(/(password|passwd|pass)=([^\s&]+)/gi, '$1=[REDACTED]')
      .replace(/(token|access_token|refresh_token)=([^\s&]+)/gi, '$1=[REDACTED]')
      .replace(/(cookie|session|secret|api_key|authorization)=([^\s&]+)/gi, '$1=[REDACTED]')
      .replace(/("password"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3')
      .replace(/("token"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3')
      .replace(/("secret"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3')
      .replace(/("cookie"\s*:\s*")([^"]+)(")/gi, '$1[REDACTED]$3');
  }

  if (Array.isArray(data)) {
    return data.map(item => redactSensitive(item));
  }

  if (typeof data === 'object') {
    const clean: Record<string, any> = {};
    const sensitiveKeys = [
      'password',
      'passwd',
      'secret',
      'token',
      'accessToken',
      'refreshToken',
      'cookie',
      'sessionToken',
      'apiKey',
      'api_key',
      'encrypted_credential',
      '2fa_secret'
    ];

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
        clean[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        clean[key] = redactSensitive(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }

  return data;
}

/**
 * Generate unique distributed Trace ID for tracking requests across API, Queue, Worker, Provider.
 */
export function generateTraceId(): string {
  return `trace_${crypto.randomBytes(12).toString('hex')}`;
}

/**
 * Calculate SHA-256 hash of payload for idempotency verification & webhook replay protection.
 */
export function hashPayload(payload: any): string {
  const normalized = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}
