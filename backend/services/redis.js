/**
 * Redis Service - Salifz
 * Handles caching, leaderboards, and real-time data
 */

const { createClient } = require('redis');

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      this.client = createClient({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 8082
        },
        password: process.env.REDIS_PASSWORD || undefined
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        console.log('Redis connecting...');
      });

      this.client.on('ready', () => {
        console.log('Redis ready');
        this.isConnected = true;
      });

      await this.client.connect();
      this.isConnected = true;
    } catch (error) {
      console.error('Redis connection failed:', error.message);
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  // ============================================
  // Generic Cache Operations
  // ============================================

  async get(key) {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    if (!this.isConnected) return false;
    try {
      await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    try {
      return await this.client.exists(key);
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // Leaderboard Operations (Sorted Sets)
  // ============================================

  // Keys: leaderboard:global:weekly, leaderboard:league:{league}:weekly
  
  async updateLeaderboard(leaderboardKey, userId, score) {
    if (!this.isConnected) return false;
    try {
      await this.client.zAdd(leaderboardKey, { score, value: userId.toString() });
      return true;
    } catch (error) {
      console.error('Redis ZADD error:', error);
      return false;
    }
  }

  async getLeaderboard(leaderboardKey, start = 0, end = 29) {
    if (!this.isConnected) return [];
    try {
      const results = await this.client.zRangeWithScores(leaderboardKey, start, end, { REV: true });
      return results.map((item, index) => ({
        rank: start + index + 1,
        userId: item.value,
        score: item.score
      }));
    } catch (error) {
      console.error('Redis ZRANGE error:', error);
      return [];
    }
  }

  async getUserRank(leaderboardKey, userId) {
    if (!this.isConnected) return null;
    try {
      const rank = await this.client.zRevRank(leaderboardKey, userId.toString());
      const score = await this.client.zScore(leaderboardKey, userId.toString());
      return rank !== null ? { rank: rank + 1, score } : null;
    } catch (error) {
      console.error('Redis ZREVRANK error:', error);
      return null;
    }
  }

  async getLeaderboardSize(leaderboardKey) {
    if (!this.isConnected) return 0;
    try {
      return await this.client.zCard(leaderboardKey);
    } catch (error) {
      return 0;
    }
  }

  // Reset weekly leaderboards
  async resetWeeklyLeaderboards() {
    if (!this.isConnected) return;
    try {
      const keys = await this.client.keys('leaderboard:*:weekly');
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      console.log('Weekly leaderboards reset');
    } catch (error) {
      console.error('Error resetting leaderboards:', error);
    }
  }

  // ============================================
  // Daily Streak Tracking
  // ============================================

  async recordDailyActivity(userId) {
    if (!this.isConnected) return false;
    const today = new Date().toISOString().split('T')[0];
    const key = `activity:${userId}:${today}`;
    try {
      await this.client.set(key, '1', { EX: 86400 * 3 }); // 3 days TTL
      return true;
    } catch (error) {
      return false;
    }
  }

  async checkDailyActivity(userId, date = null) {
    if (!this.isConnected) return false;
    const checkDate = date || new Date().toISOString().split('T')[0];
    const key = `activity:${userId}:${checkDate}`;
    try {
      return await this.client.exists(key);
    } catch (error) {
      return false;
    }
  }

  // ============================================
  // Session Management
  // ============================================

  async setUserSession(userId, sessionData, ttlSeconds = 86400) {
    const key = `session:${userId}`;
    return await this.set(key, sessionData, ttlSeconds);
  }

  async getUserSession(userId) {
    const key = `session:${userId}`;
    return await this.get(key);
  }

  async deleteUserSession(userId) {
    const key = `session:${userId}`;
    return await this.del(key);
  }

  // ============================================
  // Rate Limiting
  // ============================================

  async checkRateLimit(identifier, maxRequests, windowSeconds) {
    if (!this.isConnected) return { allowed: true };
    
    const key = `ratelimit:${identifier}`;
    try {
      const current = await this.client.incr(key);
      if (current === 1) {
        await this.client.expire(key, windowSeconds);
      }
      
      const ttl = await this.client.ttl(key);
      
      return {
        allowed: current <= maxRequests,
        current,
        remaining: Math.max(0, maxRequests - current),
        resetIn: ttl
      };
    } catch (error) {
      return { allowed: true };
    }
  }

  // ============================================
  // Real-time Features
  // ============================================

  // Active users in a halaqa
  async addToHalaqaActive(halaqaId, userId) {
    if (!this.isConnected) return;
    const key = `halaqa:${halaqaId}:active`;
    await this.client.sAdd(key, userId.toString());
    await this.client.expire(key, 3600); // 1 hour
  }

  async removeFromHalaqaActive(halaqaId, userId) {
    if (!this.isConnected) return;
    const key = `halaqa:${halaqaId}:active`;
    await this.client.sRem(key, userId.toString());
  }

  async getHalaqaActiveUsers(halaqaId) {
    if (!this.isConnected) return [];
    const key = `halaqa:${halaqaId}:active`;
    return await this.client.sMembers(key);
  }

  // ============================================
  // Caching Helpers
  // ============================================

  // Cache user stats
  async cacheUserStats(userId, stats) {
    return await this.set(`stats:${userId}`, stats, 300); // 5 min cache
  }

  async getCachedUserStats(userId) {
    return await this.get(`stats:${userId}`);
  }

  // Cache surah data
  async cacheSurahData(surahNumber, data) {
    return await this.set(`surah:${surahNumber}`, data, 86400); // 24h cache
  }

  async getCachedSurahData(surahNumber) {
    return await this.get(`surah:${surahNumber}`);
  }

  // Invalidate user cache
  async invalidateUserCache(userId) {
    const patterns = [
      `stats:${userId}`,
      `session:${userId}`,
      `progress:${userId}:*`
    ];
    
    for (const pattern of patterns) {
      if (pattern.includes('*')) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        await this.del(pattern);
      }
    }
  }
}

// Singleton instance
const redisService = new RedisService();

module.exports = redisService;
