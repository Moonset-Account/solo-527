
namespace GridEventManagement.Web.Services;

public interface IRedisCacheService
{
    Task<string?> GetCacheValueAsync(string key);
    Task SetCacheValueAsync(string key, string value, TimeSpan? expiration = null);
    Task RemoveCacheValueAsync(string key);
    Task<bool> KeyExistsAsync(string key);
}
