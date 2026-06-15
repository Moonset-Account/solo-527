
namespace PrintingFactory.Infrastructure.Cache;

public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default);
    Task RemoveAsync(string key, CancellationToken cancellationToken = default);
    Task<bool> ExistsAsync(string key, CancellationToken cancellationToken = default);
    Task<long> IncrementAsync(string key, long value = 1, CancellationToken cancellationToken = default);
    Task<HashSet<string>> GetSetAsync(string key, CancellationToken cancellationToken = default);
    Task AddToSetAsync(string key, string value, CancellationToken cancellationToken = default);
    Task RemoveFromSetAsync(string key, string value, CancellationToken cancellationToken = default);
}
