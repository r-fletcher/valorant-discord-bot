const cache = new Map();
const CACHE_TTL = 60 * 1000;

module.exports = {
    get(key) {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() - entry.timestamp > CACHE_TTL) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    },
    set(key, data) {
        cache.set(key, {data, timestamp: Date.now()});
        console.log(cache);
    },
    delete(key) {
        cache.delete(key);
        console.log(cache);
    }
}