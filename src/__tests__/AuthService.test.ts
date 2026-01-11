/**
 * AuthService Unit Tests
 *
 * Tests for password hashing and verification functionality
 * These are pure functions that don't require database mocking
 */

import { AuthService } from '../services/AuthService'

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    // Create a fresh instance for each test
    authService = new AuthService()
  })

  describe('hashPassword', () => {
    /**
     * Test 1: Password hashing creates valid format
     * Verifies that hashPassword returns a string in the format "salt:hash"
     */
    test('should create a hash in the correct format (salt:hash)', () => {
      const password = 'TestPassword123!'
      const hash = authService.hashPassword(password)

      // Hash should contain a colon separating salt and hash
      expect(hash).toContain(':')

      const parts = hash.split(':')
      expect(parts).toHaveLength(2)

      // Salt should be 32 hex characters (16 bytes)
      expect(parts[0]).toHaveLength(32)

      // Hash should be 128 hex characters (64 bytes)
      expect(parts[1]).toHaveLength(128)
    })

    /**
     * Test 2: Same password produces different hashes (due to random salt)
     * Verifies that the salt is randomly generated for each hash
     */
    test('should produce different hashes for the same password', () => {
      const password = 'SamePassword123!'

      const hash1 = authService.hashPassword(password)
      const hash2 = authService.hashPassword(password)

      // Hashes should be different due to different random salts
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('verifyPassword', () => {
    /**
     * Test 3: Correct password verification returns true
     * Verifies that verifyPassword correctly validates a matching password
     */
    test('should return true for correct password', () => {
      const password = 'CorrectPassword123!'
      const hash = authService.hashPassword(password)

      const result = authService.verifyPassword(password, hash)

      expect(result).toBe(true)
    })

    /**
     * Test 4: Incorrect password verification returns false
     * Verifies that verifyPassword rejects non-matching passwords
     */
    test('should return false for incorrect password', () => {
      const password = 'CorrectPassword123!'
      const wrongPassword = 'WrongPassword456!'
      const hash = authService.hashPassword(password)

      const result = authService.verifyPassword(wrongPassword, hash)

      expect(result).toBe(false)
    })

    /**
     * Test 5: Invalid hash format returns false
     * Verifies that verifyPassword handles invalid hash formats gracefully
     */
    test('should return false for invalid hash format', () => {
      const password = 'TestPassword123!'

      // Missing colon separator
      const invalidHash1 = 'invalidhashwithoutcolon'
      expect(authService.verifyPassword(password, invalidHash1)).toBe(false)

      // Empty string
      const invalidHash2 = ''
      expect(authService.verifyPassword(password, invalidHash2)).toBe(false)

      // Only salt, no hash
      const invalidHash3 = 'onlysalt:'
      expect(authService.verifyPassword(password, invalidHash3)).toBe(false)
    })
  })
})
