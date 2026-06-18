using StackExchange.Redis;
using System.Text.Json;

namespace ArtEduScheduler.API.Services;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default);
}

public class RedisCacheService : ICacheService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly IDatabase _db;

    public RedisCacheService(IConnectionMultiplexer redis)
    {
        _redis = redis;
        _db = redis.GetDatabase();
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        var value = await _db.StringGetAsync(key);
        if (!value.HasValue) return default;
        return JsonSerializer.Deserialize<T>(value!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        var serialized = JsonSerializer.Serialize(value);
        await _db.StringSetAsync(key, serialized, expiry);
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        await _db.KeyDeleteAsync(key);
    }

    public async Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        var server = _redis.GetServer(_redis.GetEndPoints().First());
        var keys = server.Keys(pattern: $"{prefix}*").ToArray();
        if (keys.Any())
        {
            await _db.KeyDeleteAsync(keys);
        }
    }
}

public class MemoryCacheService : ICacheService
{
    private readonly Dictionary<string, (object Value, DateTime? Expiry)> _cache = new();
    private readonly object _lock = new();

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            if (_cache.TryGetValue(key, out var entry))
            {
                if (entry.Expiry.HasValue && entry.Expiry.Value < DateTime.UtcNow)
                {
                    _cache.Remove(key);
                    return Task.FromResult<T?>(default);
                }
                return Task.FromResult((T?)entry.Value);
            }
            return Task.FromResult<T?>(default);
        }
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            _cache[key] = (value!, expiry.HasValue ? DateTime.UtcNow.Add(expiry.Value) : null);
        }
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            _cache.Remove(key);
        }
        return Task.CompletedTask;
    }

    public Task RemoveByPrefixAsync(string prefix, CancellationToken cancellationToken = default)
    {
        lock (_lock)
        {
            var keysToRemove = _cache.Keys.Where(k => k.StartsWith(prefix)).ToList();
            foreach (var key in keysToRemove)
            {
                _cache.Remove(key);
            }
        }
        return Task.CompletedTask;
    }
}
