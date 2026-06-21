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
        var forceSqlite = string.Equals(configuration["UseSqlite"], "true", StringComparison.OrdinalIgnoreCase);
        var enableAutoFallback = string.Equals(configuration["EnableAutoFallback"], "true", StringComparison.OrdinalIgnoreCase);

        bool useSqlite = forceSqlite;

        if (!forceSqlite && enableAutoFallback && !string.IsNullOrEmpty(sqlConnection))
        {
            try
            {
                var builder = new DbContextOptionsBuilder<AppDbContext>();
                builder.UseSqlServer(sqlConnection, opts => opts.CommandTimeout(3));
                using var testCtx = new AppDbContext(builder.Options);
                testCtx.Database.OpenConnection();
                testCtx.Database.CloseConnection();
            }
            catch (Exception)
            {
                useSqlite = true;
            }
        }
        else if (forceSqlite || string.IsNullOrEmpty(sqlConnection))
        {
            useSqlite = true;
        }

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
        var forceMemoryCache = string.Equals(configuration["UseInMemoryCache"], "true", StringComparison.OrdinalIgnoreCase);

        bool useRedis = !forceMemoryCache && !string.IsNullOrEmpty(redisConnectionString);

        services.AddMemoryCache();

        if (useRedis)
        {
            try
            {
                var redisConfig = ConfigurationOptions.Parse(redisConnectionString!);
                redisConfig.AbortOnConnectFail = !enableAutoFallback;
                redisConfig.ConnectTimeout = 3000;
                redisConfig.SyncTimeout = 3000;

                var multiplexer = ConnectionMultiplexer.Connect(redisConfig);
                if (enableAutoFallback && !multiplexer.IsConnected)
                {
                    useRedis = false;
                }
                else
                {
                    services.AddSingleton<IConnectionMultiplexer>(multiplexer);
                    services.AddScoped<IRedisCacheService, RedisCacheService>();
                }
            }
            catch (Exception)
            {
                if (enableAutoFallback)
                    useRedis = false;
                else
                    throw;
            }
        }

        if (!useRedis)
        {
            services.AddScoped<IRedisCacheService, MemoryCacheService>();
        }

        return services;
    }
}
