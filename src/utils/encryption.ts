import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'

/**
 * Encrypts a string using AES-256-GCM.
 * Requires ENCRYPTION_KEY (32 hex characters) in environment.
 */
export function encrypt(text: string): string {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  
  const key = Buffer.from(keyHex, 'hex')
  const iv = crypto.randomBytes(12) // GCM standard IV length is 12 bytes
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag().toString('hex')
  
  // Format: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`
}

/**
 * Decrypts a string encrypted by the encrypt() function.
 */
export function decrypt(encryptedStr: string): string {
  const keyHex = process.env.ENCRYPTION_KEY
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)')
  }
  
  const parts = encryptedStr.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const authTag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]
  
  const key = Buffer.from(keyHex, 'hex')
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
