using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Interfaces;
using ProcessScheduling.Infrastructure.Cache;
using ProcessScheduling.Infrastructure.Data;
using ProcessScheduling.Infrastructure.Repositories;
using ProcessScheduling.Infrastructure.Security;
using StackExchange.Redis;

namespace ProcessScheduling.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services, IConfiguration configuration)
    {
        var sqlConnection = configuration.GetConnectionString("DefaultConnection");
        var useSqlite = string.Equals(configuration["UseSqlite"], "true", StringComparison.OrdinalIgnoreCase)
                        || string.IsNullOrEmpty(sqlConnection);

        services.AddDbContext<AppDbContext>(options =>
        {
            if (useSqlite)
            {
                var sqlitePath = configuration["SqlitePath"] ?? "ProcessScheduling.db";
                options.UseSqlite($"Data Source={sqlitePath}");
            }
            else
            {
                options.UseSqlServer(sqlConnection);
            }
        });

        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IEquipmentRepository, EquipmentRepository>();
        services.AddScoped<IShiftRepository, ShiftRepository>();
        services.AddScoped<IWorkOrderRepository, WorkOrderRepository>();
        services.AddScoped<IProcessStepInstanceRepository, ProcessStepInstanceRepository>();
        services.AddScoped<IProductionRecordRepository, ProductionRecordRepository>();
        services.AddScoped<IDowntimeRecordRepository, DowntimeRecordRepository>();
        services.AddScoped<IAnomalyReportRepository, AnomalyReportRepository>();
        services.AddScoped<IWorkReportRepository, WorkReportRepository>();
        services.AddScoped<IMoldRepository, MoldRepository>();
        services.AddScoped<IQCResultRepository, QCResultRepository>();
        services.AddScoped<IAdjustmentRecordRepository, AdjustmentRecordRepository>();
        services.AddScoped<IOperationLogRepository, OperationLogRepository>();

        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        var redisConnectionString = configuration.GetConnectionString("Redis");
        var useRedis = !string.Equals(configuration["UseInMemoryCache"], "true", StringComparison.OrdinalIgnoreCase)
                       && !string.IsNullOrEmpty(redisConnectionString);

        services.AddMemoryCache();

        if (useRedis)
        {
            try
            {
                var redisConfig = ConfigurationOptions.Parse(redisConnectionString!);
                redisConfig.AbortOnConnectFail = false;
                redisConfig.ConnectTimeout = 3000;
                redisConfig.SyncTimeout = 3000;

                services.AddSingleton<IConnectionMultiplexer>(sp =>
                    ConnectionMultiplexer.Connect(redisConfig));
                services.AddScoped<IRedisCacheService, RedisCacheService>();
            }
            catch (Exception)
            {
                services.AddScoped<IRedisCacheService, MemoryCacheService>();
            }
        }
        else
        {
            services.AddScoped<IRedisCacheService, MemoryCacheService>();
        }

        return services;
    }
}
