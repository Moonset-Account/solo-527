
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using PrintingFactory.Domain.Interfaces;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;
using StackExchange.Redis;

namespace PrintingFactory.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<PrintingFactoryDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly(typeof(PrintingFactoryDbContext).Assembly.FullName)));

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

        var redisConnectionString = configuration.GetConnectionString("RedisConnection");
        services.AddSingleton<IConnectionMultiplexer>(sp =>
            ConnectionMultiplexer.Connect(redisConnectionString ?? "localhost:6379"));
        services.AddScoped<ICacheService, RedisCacheService>();

        return services;
    }
}
