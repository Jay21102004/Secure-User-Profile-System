const { 
  hashPassword, 
  comparePassword, 
  validatePasswordStrength, 
  generateSecurePassword 
} = require('../src/utils/password');

describe('Password Utilities', () => {
  const testPassword = 'TestPassword123!';
  const weakPassword = 'password';
  const strongPassword = 'MyStr0ng!P@ssw0rd2023';

  describe('hashPassword function', () => {
    test('should hash password successfully', async () => {
      const hashed = await hashPassword(testPassword);
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(testPassword);
      expect(hashed.length).toBeGreaterThan(50); // Bcrypt hashes are typically 60 chars
    });

    test('should produce different hashes for same password', async () => {
      const hash1 = await hashPassword(testPassword);
      const hash2 = await hashPassword(testPassword);
      expect(hash1).not.toBe(hash2); // Due to random salt
    });

    test('should reject empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
      await expect(hashPassword(null)).rejects.toThrow('Password cannot be empty');
      await expect(hashPassword(undefined)).rejects.toThrow('Password cannot be empty');
    });

    test('should reject short password', async () => {
      await expect(hashPassword('12345')).rejects.toThrow('Password must be at least 6 characters long');
      await expect(hashPassword('a')).rejects.toThrow('Password must be at least 6 characters long');
    });

    test('should handle various password lengths', async () => {
      const passwords = [
        'Pass123!', // Minimum length
        'MediumLengthPassword123!',
        'VeryLongPasswordWithLotsOfCharactersAndSymbols123!@#$%^&*()',
        'A'.repeat(128) // Maximum practical length
      ];

      for (const password of passwords) {
        const hashed = await hashPassword(password);
        expect(hashed).toBeDefined();
        expect(hashed).not.toBe(password);
      }
    });
  });

  describe('comparePassword function', () => {
    test('should return true for correct password', async () => {
      const hashed = await hashPassword(testPassword);
      const isMatch = await comparePassword(testPassword, hashed);
      expect(isMatch).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const hashed = await hashPassword(testPassword);
      const isMatch = await comparePassword('wrongpassword', hashed);
      expect(isMatch).toBe(false);
    });

    test('should return false for empty inputs', async () => {
      const hashed = await hashPassword(testPassword);
      
      expect(await comparePassword('', hashed)).toBe(false);
      expect(await comparePassword(testPassword, '')).toBe(false);
      expect(await comparePassword(null, hashed)).toBe(false);
      expect(await comparePassword(testPassword, null)).toBe(false);
      expect(await comparePassword(undefined, hashed)).toBe(false);
      expect(await comparePassword(testPassword, undefined)).toBe(false);
    });

    test('should be case sensitive', async () => {
      const hashed = await hashPassword(testPassword);
      const isMatch = await comparePassword(testPassword.toLowerCase(), hashed);
      expect(isMatch).toBe(false);
    });

    test('should handle special characters correctly', async () => {
      const specialPassword = 'P@$$w0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashed = await hashPassword(specialPassword);
      const isMatch = await comparePassword(specialPassword, hashed);
      expect(isMatch).toBe(true);
    });
  });

  describe('validatePasswordStrength function', () => {
    test('should validate strong passwords', () => {
      const strongPasswords = [
        'MyStr0ng!P@ssw0rd',
        'C0mpl3x&S3cur3!',
        'Test123!@#Password',
        'Secure2023$Password'
      ];

      strongPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual([]);
      });
    });

    test('should reject weak passwords', () => {
      const weakPasswords = [
        { password: '', expectedErrors: ['Password is required'] },
        { password: 'short', expectedErrors: ['Password must be at least 8 characters long'] },
        { password: 'nouppercase123!', expectedErrors: ['Password must contain at least one uppercase letter'] },
        { password: 'NOLOWERCASE123!', expectedErrors: ['Password must contain at least one lowercase letter'] },
        { password: 'NoNumbers!@#', expectedErrors: ['Password must contain at least one number'] },
        { password: 'NoSpecialChars123', expectedErrors: ['Password must contain at least one special character'] }
      ];

      weakPasswords.forEach(({ password, expectedErrors }) => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expectedErrors.forEach(error => {
          expect(result.errors).toContain(error);
        });
      });
    });

    test('should reject common passwords', () => {
      const commonPasswords = [
        'password',
        '123456',
        'password123',
        'admin',
        'qwerty'
      ];

      commonPasswords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => 
          error.includes('too common')
        )).toBe(true);
      });
    });

    test('should reject very long passwords', () => {
      const tooLongPassword = 'A'.repeat(129) + '1!';
      const result = validatePasswordStrength(tooLongPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be less than 128 characters long');
    });

    test('should provide multiple error messages for multiple issues', () => {
      const terriblePassword = 'abc'; // Short, no uppercase, no numbers, no special chars
      const result = validatePasswordStrength(terriblePassword);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('generateSecurePassword function', () => {
    test('should generate password with default length', () => {
      const password = generateSecurePassword();
      expect(password).toBeDefined();
      expect(password.length).toBe(16);
    });

    test('should generate password with custom length', () => {
      const lengths = [8, 12, 20, 32];
      lengths.forEach(length => {
        const password = generateSecurePassword(length);
        expect(password.length).toBe(length);
      });
    });

    test('should generate passwords that meet strength requirements', () => {
      for (let i = 0; i < 10; i++) {
        const password = generateSecurePassword();
        const validation = validatePasswordStrength(password);
        expect(validation.isValid).toBe(true);
      }
    });

    test('should generate different passwords each time', () => {
      const passwords = new Set();
      for (let i = 0; i < 100; i++) {
        passwords.add(generateSecurePassword());
      }
      // Should generate unique passwords (very high probability)
      expect(passwords.size).toBe(100);
    });

    test('should contain all required character types', () => {
      const password = generateSecurePassword(20);
      
      expect(/[a-z]/.test(password)).toBe(true); // lowercase
      expect(/[A-Z]/.test(password)).toBe(true); // uppercase
      expect(/\d/.test(password)).toBe(true); // numbers
      expect(/[!@#$%^&*()]/.test(password)).toBe(true); // special chars
    });

    test('should handle edge cases for length', () => {
      // Test minimum practical length
      const shortPassword = generateSecurePassword(8);
      expect(shortPassword.length).toBe(8);
      
      // Test longer password
      const longPassword = generateSecurePassword(50);
      expect(longPassword.length).toBe(50);
    });
  });

  describe('End-to-end password operations', () => {
    test('should complete full password lifecycle', async () => {
      // Generate a secure password
      const generatedPassword = generateSecurePassword();
      
      // Validate it's strong
      const validation = validatePasswordStrength(generatedPassword);
      expect(validation.isValid).toBe(true);
      
      // Hash the password
      const hashedPassword = await hashPassword(generatedPassword);
      
      // Verify it can be compared correctly
      const isCorrect = await comparePassword(generatedPassword, hashedPassword);
      expect(isCorrect).toBe(true);
      
      // Verify wrong password doesn't match
      const isWrong = await comparePassword('wrongpassword', hashedPassword);
      expect(isWrong).toBe(false);
    });

    test('should handle multiple concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => 
        hashPassword(`TestPassword${i}123!`)
      );
      
      const hashes = await Promise.all(operations);
      
      // All should be different
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(10);
      
      // All should be valid
      hashes.forEach(hash => {
        expect(hash).toBeDefined();
        expect(hash.length).toBeGreaterThan(50);
      });
    });

    test('should maintain security over multiple hash/compare cycles', async () => {
      const password = 'ConsistentTestPassword123!';
      
      for (let i = 0; i < 5; i++) {
        const hashed = await hashPassword(password);
        const isMatch = await comparePassword(password, hashed);
        expect(isMatch).toBe(true);
        
        const isNotMatch = await comparePassword('wrong', hashed);
        expect(isNotMatch).toBe(false);
      }
    });
  });
});