/**
 * A utility class for hashing strings.
 */
class Hasher {
  /**
   * Generates a hash from a string.
   * @param {string} str The input string to hash.
   * @returns {string} The generated hash as a string.
   */
  static hash(str) {
    let hash = 0;
    if (str.length === 0) return hash;

    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char; // hash = hash * 31 + char
      hash |= 0; // Convert to 32bit integer
    }
    return "_" + Math.abs(hash).toString(16);
  }
}
