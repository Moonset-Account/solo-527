using Counseling.Application.Interfaces;
using StackExchange.Redis;
using System.Text.Json;

namespace Counseling.Infrastructure.Caching;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var value = await _db.StringGetAsync(key);
        if (!value.HasValue)
        {
            return default;
        }
        return JsonSerializer.Deserialize<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        var serialized = JsonSerializer.Serialize(value);
        if (expiration.HasValue)
        {
            await _db.StringSetAsync(key, serialized, expiration.Value);
        }
        else
        {
            await _db.StringSetAsync(key, serialized);
        }
    }

    public async Task RemoveAsync(string key)
    {
        await _db.KeyDeleteAsync(key);
    }

    public async Task<bool> ExistsAsync(string key)
    {
        return await _db.KeyExistsAsync(key);
    }

    public async Task<List<T>?> GetListAsync<T>(string key)
    {
        var value = await _db.StringGetAsync(key);
        if (!value.HasValue)
        {
            return default;
        }
        return JsonSerializer.Deserialize<List<T>>(value!);
    }

    public async Task SetListAsync<T>(string key, List<T> values, TimeSpan? expiration = null)
    {
        var serialized = JsonSerializer.Serialize(values);
        if (expiration.HasValue)
        {
            await _db.StringSetAsync(key, serialized, expiration.Value);
        }
        else
        {
            await _db.StringSetAsync(key, serialized);
        }
    }
}
