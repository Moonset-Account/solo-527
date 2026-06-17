namespace AgricultureTraceability.Infrastructure.Caching;

public interface IRedisCacheService
{
    Task<T?> GetAsync<T>(string key);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null);
    Task RemoveAsync(string key);
    Task<T?> GetOrCreateAsync<T>(string key, Func<Task<T>> factory, TimeSpan? expiry = null);
    Task HashSetAsync<T>(string key, string hashField, T value);
    Task<T?> HashGetAsync<T>(string key, string hashField);
}
