
using Newtonsoft.Json;
using StackExchange.Redis;

namespace PrintingFactory.Infrastructure.Cache;

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _database;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _database = _redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var value = await _database.StringGetAsync(key);
        if (!value.HasValue) return default;
        return JsonConvert.DeserializeObject<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        var serialized = JsonConvert.SerializeObject(value);
        await _database.StringSetAsync(key, serialized, expiration);
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        await _database.KeyDeleteAsync(key);
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default)
    {
        return await _database.KeyExistsAsync(key);
    }

    public async Task<long> IncrementAsync(string key, long value = 1, CancellationToken cancellationToken = default)
    {
        return await _database.StringIncrementAsync(key, value);
    }

    public async Task<HashSet<string>> GetSetAsync(string key, CancellationToken cancellationToken = default)
    {
        var members = await _database.SetMembersAsync(key);
        return new HashSet<string>(members.Select(m => m.ToString()));
    }

    public async Task AddToSetAsync(string key, string value, CancellationToken cancellationToken = default)
    {
        await _database.SetAddAsync(key, value);
    }

    public async Task RemoveFromSetAsync(string key, string value, CancellationToken cancellationToken = default)
    {
        await _database.SetRemoveAsync(key, value);
    }
}
