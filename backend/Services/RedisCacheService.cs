
using StackExchange.Redis;

namespace GridEventManagement.Web.Services;

public class RedisCacheService : IRedisCacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _database = _redis.GetDatabase();
    }

    public async Task<string?> GetCacheValueAsync(string key)
    {
        return await _database.StringGetAsync(key);
    }

    public async Task SetCacheValueAsync(string key, string value, TimeSpan? expiration = null)
    {
        if (expiration.HasValue)
        {
            await _database.StringSetAsync(key, value, expiration.Value);
        }
        else
        {
            await _database.StringSetAsync(key, value);
        }
    }

    public async Task RemoveCacheValueAsync(string key)
    {
        await _database.KeyDeleteAsync(key);
    }

    public async Task<bool> KeyExistsAsync(string key)
    {
        return await _database.KeyExistsAsync(key);
    }
}
