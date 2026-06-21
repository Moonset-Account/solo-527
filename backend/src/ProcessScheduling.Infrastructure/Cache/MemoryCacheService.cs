using Microsoft.Extensions.Caching.Memory;

namespace ProcessScheduling.Infrastructure.Cache;

public class MemoryCacheService : IRedisCacheService
{
    private readonly IMemoryCache _cache;

    public MemoryCacheService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public Task<string?> GetAsync(string key)
    {
        var result = _cache.Get<string>(key);
        return Task.FromResult(result);
    }

    public Task SetAsync(string key, string value, TimeSpan? expiry = null)
    {
        var options = new MemoryCacheEntryOptions();
        if (expiry.HasValue)
            options.AbsoluteExpirationRelativeToNow = expiry.Value;
        _cache.Set(key, value, options);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key)
    {
        _cache.Remove(key);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string key)
    {
        var exists = _cache.TryGetValue(key, out _);
        return Task.FromResult(exists);
    }
}
