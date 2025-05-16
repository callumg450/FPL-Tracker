const DEFAULT_TTL = 30 * 1000; // 30 seconds default TTL

const cache = {
  data: new Map(),
  timestamps: new Map(),
  TTL: {
    BOOTSTRAP: 5 * 60 * 1000, // 5 minutes
    FIXTURES: 5 * 60 * 1000,  // 5 minutes
    LIVE: 30 * 1000,          // 30 seconds
    ELEMENT_SUMMARY: 5 * 60 * 1000, // 5 minutes
    USERS_TEAMS: 30 * 1000,     // 30 seconds
    USER_TEAM_CURRENT_GW: 30 * 1000,     // 30 seconds
    ENTRY_HISTORY: 5 * 60 * 1000,  // 5 minutes
  }
};

const cacheKey = (type, params = {}) => {
  return `${type}:${JSON.stringify(params)}`;
};

const get = (type, params = {}) => {
  const key = cacheKey(type, params);
  const timestamp = cache.timestamps.get(key);
  if (!timestamp) return null;
  const age = Date.now() - timestamp;
  const ttl = cache.TTL[type] || DEFAULT_TTL;
  if (age > ttl) {
    cache.data.delete(key);
    cache.timestamps.delete(key);
    return null;
  }

  return cache.data.get(key);
};

const set = (type, data, params = {}) => {
  const key = cacheKey(type, params);
  cache.data.set(key, data);
  cache.timestamps.set(key, Date.now());
};

module.exports = { get, set };
