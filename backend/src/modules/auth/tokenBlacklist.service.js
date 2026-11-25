/**
 * Token Blacklist abstraction (Dependency Inversion Principle).
 * Default implementation stores revoked JWTs in memory with automatic TTL cleanup.
 * Swap with a Redis-backed implementation exposing the same async methods (`add`, `isBlacklisted`, `clearExpired`)
 * without modifying `auth.service.js` or `authenticateJWT.js`.
 */
export class InMemoryTokenBlacklist {
  constructor({ sweepIntervalMs = 15 * 60 * 1000 } = {}) {
    this.store = new Map();
    this.sweepTimer = setInterval(() => {
      this.clearExpired();
    }, sweepIntervalMs);

    if (typeof this.sweepTimer.unref === 'function') {
      this.sweepTimer.unref();
    }
  }

  async add(token, expiresAtMs) {
    if (!token) return;
    const expiry = Number.isFinite(expiresAtMs) ? expiresAtMs : Date.now() + 8 * 60 * 60 * 1000;
    this.store.set(token, expiry);
  }

  async isBlacklisted(token) {
    if (!token) return false;
    const expiresAtMs = this.store.get(token);
    if (expiresAtMs === undefined) {
      return false;
    }

    if (Date.now() >= expiresAtMs) {
      this.store.delete(token);
      return false;
    }

    return true;
  }

  clearExpired() {
    const now = Date.now();
    for (const [token, expiresAtMs] of this.store.entries()) {
      if (now >= expiresAtMs) {
        this.store.delete(token);
      }
    }
  }

  clearAll() {
    this.store.clear();
  }
}

export const tokenBlacklistService = new InMemoryTokenBlacklist();
export default tokenBlacklistService;
