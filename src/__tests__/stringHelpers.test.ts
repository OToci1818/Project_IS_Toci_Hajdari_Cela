/**
 * String Helpers Unit Tests
 *
 * Tests for utility functions in stringHelpers.ts
 */

import { capitalize } from '../utils/stringHelpers'

describe('stringHelpers', () => {
  describe('capitalize', () => {
    /**
     * Test 6: Capitalize converts first letter to uppercase
     * Verifies basic capitalization functionality
     */
    test('should capitalize the first letter of a word', () => {
      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('world')).toBe('World')
      expect(capitalize('test')).toBe('Test')
    })

    /**
     * Test 7: Capitalize handles edge cases
     * Verifies the function handles various edge cases correctly
     */
    test('should handle edge cases correctly', () => {
      // Empty string
      expect(capitalize('')).toBe('')

      // Already capitalized
      expect(capitalize('Hello')).toBe('Hello')

      // Single character
      expect(capitalize('a')).toBe('A')

      // All uppercase
      expect(capitalize('HELLO')).toBe('HELLO')

      // Numbers at start
      expect(capitalize('123test')).toBe('123test')
    })
  })
})
