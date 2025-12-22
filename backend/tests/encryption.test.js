const { encrypt, decrypt, isValidEncryptedFormat, secureCompare } = require('../src/utils/encryption');

describe('Encryption Utilities', () => {
  const testData = '123456789012'; // Sample 12-digit Aadhaar
  const sensitiveData = 'CONFIDENTIAL_INFO_123';

  describe('encrypt function', () => {
    test('should encrypt text successfully', () => {
      const encrypted = encrypt(testData);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(testData);
      expect(encrypted).toContain(':'); // IV:encryptedData format
    });

    test('should throw error for empty text', () => {
      expect(() => encrypt('')).toThrow('Text to encrypt cannot be empty');
      expect(() => encrypt(null)).toThrow('Text to encrypt cannot be empty');
      expect(() => encrypt(undefined)).toThrow('Text to encrypt cannot be empty');
    });

    test('should produce different results for same input (due to random IV)', () => {
      const encrypted1 = encrypt(testData);
      const encrypted2 = encrypt(testData);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('decrypt function', () => {
    test('should decrypt encrypted text successfully', () => {
      const encrypted = encrypt(testData);
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(testData);
    });

    test('should handle different data types', () => {
      const testCases = [
        '123456789012',
        'test@example.com',
        'Complex Data with Special!@#$%^&*()Characters',
        '12345',
        'A'
      ];

      testCases.forEach(testCase => {
        const encrypted = encrypt(testCase);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });

    test('should throw error for invalid encrypted format', () => {
      expect(() => decrypt('')).toThrow('Invalid encrypted text format');
      expect(() => decrypt('invalidformat')).toThrow('Invalid encrypted text format');
      expect(() => decrypt('no_colon_separator')).toThrow('Invalid encrypted text format');
      expect(() => decrypt(':')).toThrow('Invalid encrypted text format');
      expect(() => decrypt('abc:')).toThrow('Failed to decrypt data');
      expect(() => decrypt(':def')).toThrow('Failed to decrypt data');
    });

    test('should throw error for corrupted encrypted data', () => {
      const encrypted = encrypt(testData);
      const corrupted = encrypted.replace('a', 'z'); // Corrupt the encrypted data
      expect(() => decrypt(corrupted)).toThrow('Failed to decrypt data');
    });
  });

  describe('isValidEncryptedFormat function', () => {
    test('should return true for valid encrypted format', () => {
      const encrypted = encrypt(testData);
      expect(isValidEncryptedFormat(encrypted)).toBe(true);
    });

    test('should return false for invalid formats', () => {
      expect(isValidEncryptedFormat('')).toBe(false);
      expect(isValidEncryptedFormat('nocolon')).toBe(false);
      expect(isValidEncryptedFormat(':')).toBe(false);
      expect(isValidEncryptedFormat('multiple:colons:here')).toBe(false);
      expect(isValidEncryptedFormat(null)).toBe(false);
      expect(isValidEncryptedFormat(undefined)).toBe(false);
      expect(isValidEncryptedFormat(123)).toBe(false);
    });
  });

  describe('secureCompare function', () => {
    test('should return true for identical strings', () => {
      expect(secureCompare('hello', 'hello')).toBe(true);
      expect(secureCompare('123', '123')).toBe(true);
      expect(secureCompare('', '')).toBe(true);
    });

    test('should return false for different strings', () => {
      expect(secureCompare('hello', 'world')).toBe(false);
      expect(secureCompare('123', '456')).toBe(false);
      expect(secureCompare('test', 'TEST')).toBe(false);
    });

    test('should return false for different lengths', () => {
      expect(secureCompare('hello', 'hello123')).toBe(false);
      expect(secureCompare('short', 'longer string')).toBe(false);
      expect(secureCompare('', 'not empty')).toBe(false);
    });

    test('should return false for null or undefined inputs', () => {
      expect(secureCompare(null, 'test')).toBe(false);
      expect(secureCompare('test', null)).toBe(false);
      expect(secureCompare(undefined, 'test')).toBe(false);
      expect(secureCompare('test', undefined)).toBe(false);
      expect(secureCompare(null, null)).toBe(false);
    });

    test('should be resistant to timing attacks', () => {
      // This test ensures the function takes similar time regardless of input
      const longString1 = 'a'.repeat(1000);
      const longString2 = 'b'.repeat(1000);
      const longString3 = 'a'.repeat(999) + 'b';

      const start1 = process.hrtime();
      secureCompare(longString1, longString2);
      const end1 = process.hrtime(start1);

      const start2 = process.hrtime();
      secureCompare(longString1, longString3);
      const end2 = process.hrtime(start2);

      // The time difference should be minimal (within reasonable bounds)
      const time1 = end1[0] * 1000000000 + end1[1];
      const time2 = end2[0] * 1000000000 + end2[1];
      const timeDiff = Math.abs(time1 - time2);

      // Allow for some variance but ensure it's not significantly different
      expect(timeDiff).toBeLessThan(50000000); // 50ms difference max
    });
  });

  describe('End-to-end encryption/decryption', () => {
    test('should handle Aadhaar numbers correctly', () => {
      const aadhaarNumbers = [
        '123456789012',
        '999988887777',
        '111122223333',
        '456789123456'
      ];

      aadhaarNumbers.forEach(aadhaar => {
        const encrypted = encrypt(aadhaar);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(aadhaar);
        expect(isValidEncryptedFormat(encrypted)).toBe(true);
      });
    });

    test('should maintain data integrity over multiple operations', () => {
      let data = sensitiveData;
      
      // Encrypt and decrypt multiple times
      for (let i = 0; i < 10; i++) {
        const encrypted = encrypt(data);
        data = decrypt(encrypted);
      }
      
      expect(data).toBe(sensitiveData);
    });

    test('should work with edge cases', () => {
      const edgeCases = [
        '0',
        '1',
        '000000000000',
        '123456789012',
        'a',
        'A',
        '!@#$%^&*()',
        '123abc456def'
      ];

      edgeCases.forEach(testCase => {
        const encrypted = encrypt(testCase);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(testCase);
      });
    });
  });
});