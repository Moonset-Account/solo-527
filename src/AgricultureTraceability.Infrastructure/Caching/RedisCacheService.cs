using Newtonsoft.Json;
using StackExchange.Redis;

namespace AgricultureTraceability.Infrastructure.Caching;

public class RedisCacheService : IRedisCacheService
{
    private readonly IConnectionMultiplexer _connectionMultiplexer;
    private readonly IDatabase _database;

    public RedisCacheService(IConnectionMultiplexer connectionMultiplexer)
    {
        _connectionMultiplexer = connectionMultiplexer;
        _database = _connectionMultiplexer.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key)
    {
        var value = await _database.StringGetAsync(key);
        if (!value.HasValue)
        {
            return default;
        }
        return JsonConvert.DeserializeObject<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        var serialized = JsonConvert.SerializeObject(value);
        await _database.StringSetAsync(key, serialized, expiry);
    }

    public async Task RemoveAsync(string key)
    {
        await _database.KeyDeleteAsync(key);
    }

    public async Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null)
    {
        var cached = await GetAsync<T>(key);
        if (cached != null)
        {
            return cached;
        }

        var result = await factory();
        if (result != null)
        {
            await SetAsync(key, result, expiry);
        }
        return result;
    }

    public async Task HashSetAsync<T>(string key, string hashField, T value)
    {
        var serialized = JsonConvert.SerializeObject(value);
        await _database.HashSetAsync(key, hashField, serialized);
    }

    public async Task<T?> HashGetAsync<T>(string key, string hashField)
    {
        var value = await _database.HashGetAsync(key, hashField);
        if (!value.HasValue)
        {
            return default;
        }
        return JsonConvert.DeserializeObject<T>(value!);
    }
}
