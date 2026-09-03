// ==============================================================================
// CYBERPOOL: ENCRYPTION AT REST & SECRET MASKING UTILITIES
// ==============================================================================
import crypto from 'crypto';

const MASTER_SECRET = process.env.SOURCE_CONNECTOR_SECRET_KEY || 'cyberpool-enterprise-aes256-secret-salt-89412';
const ALGORITHM = 'aes-256-cbc';
// Derive a 32-byte key from master secret
const DERIVED_KEY = crypto.createHash('sha256').update(MASTER_SECRET).digest();

/**
 * Encrypts sensitive string (password, session cookie, auth token)
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, DERIVED_KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Format: iv:encryptedContent
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts sensitive string
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload) return '';
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 2) return '';
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM, DERIVED_KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[Security] Failed to decrypt credential:', (err as Error).message);
    return '';
  }
}

/**
 * Masks a secret so it can never be exposed in logs or frontend (e.g. "••••••••" or "ab***cd")
 */
export function maskSecret(secret?: string): string {
  if (!secret) return '••••••••';
  if (secret.length <= 4) return '••••••••';
  return `${secret.substring(0, 2)}••••••••${secret.substring(secret.length - 2)}`;
}

/**
 * Strips/redacts sensitive keys from any arbitrary object before logging or returning over API
 */
export function sanitizeLogData<T extends Record<string, any>>(data: T): T {
  if (!data || typeof data !== 'object') return data;
  const sensitiveKeys = ['password', 'encrypted_password', 'session', 'encrypted_session', 'cookie', 'token', 'secret'];
  
  const cleaned: Record<string, any> = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      cleaned[key] = '••••[REDACTED_BY_SECURITY_LAYER]••••';
    } else if (value && typeof value === 'object') {
      cleaned[key] = sanitizeLogData(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned as T;
}
