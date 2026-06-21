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
        var redisConnectionString = configuration.GetConnectionString("Redis");
        var forceSqlite = string.Equals(configuration["UseSqlite"], "true", StringComparison.OrdinalIgnoreCase);
        var forceMemoryCache = string.Equals(configuration["UseInMemoryCache"], "true", StringComparison.OrdinalIgnoreCase);
        var enableAutoFallback = string.Equals(configuration["EnableAutoFallback"], "true", StringComparison.OrdinalIgnoreCase);

        if (forceSqlite)
        {
            var sqlitePath = configuration["SqlitePath"] ?? "ProcessScheduling.db";
            services.AddDbContext<AppDbContext>(options =>
                options.UseSqlite($"Data Source={sqlitePath}"));
        }
        else
        {
            if (string.IsNullOrEmpty(sqlConnection))
                throw new InvalidOperationException("数据库连接字符串 DefaultConnection 未配置。请在 appsettings.json 的 ConnectionStrings 中配置 SQL Server 连接，或设置 UseSqlite=true 使用 SQLite。");

            try
            {
                var testBuilder = new DbContextOptionsBuilder<AppDbContext>();
                testBuilder.UseSqlServer(sqlConnection, opts => opts.CommandTimeout(5));
                using var testCtx = new AppDbContext(testBuilder.Options);
                testCtx.Database.OpenConnection();
                testCtx.Database.CloseConnection();

                services.AddDbContext<AppDbContext>(options =>
                    options.UseSqlServer(sqlConnection));
            }
            catch (Exception ex)
            {
                if (enableAutoFallback)
                {
                    var sqlitePath = configuration["SqlitePath"] ?? "ProcessScheduling.db";
                    services.AddDbContext<AppDbContext>(options =>
                        options.UseSqlite($"Data Source={sqlitePath}"));
                }
                else
                {
                    throw new InvalidOperationException($"SQL Server 连接失败: {ex.Message}。请检查 SQL Server 服务是否运行、连接字符串是否正确，或设置 UseSqlite=true 使用 SQLite。", ex);
                }
            }
        }

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

        if (forceMemoryCache)
        {
            services.AddMemoryCache();
            services.AddScoped<IRedisCacheService, MemoryCacheService>();
        }
        else
        {
            if (string.IsNullOrEmpty(redisConnectionString))
                throw new InvalidOperationException("Redis 连接字符串未配置。请在 appsettings.json 的 ConnectionStrings 中配置 Redis 连接，或设置 UseInMemoryCache=true 使用内存缓存。");

            try
            {
                var redisConfig = ConfigurationOptions.Parse(redisConnectionString);
                redisConfig.AbortOnConnectFail = true;
                redisConfig.ConnectTimeout = 5000;
                redisConfig.SyncTimeout = 5000;

                var multiplexer = ConnectionMultiplexer.Connect(redisConfig);
                if (!multiplexer.IsConnected)
                    throw new InvalidOperationException($"无法连接到 Redis 服务器 {redisConnectionString}。请检查 Redis 服务是否运行，或设置 UseInMemoryCache=true 使用内存缓存。");

                services.AddSingleton<IConnectionMultiplexer>(multiplexer);
                services.AddScoped<IRedisCacheService, RedisCacheService>();
            }
            catch (RedisConnectionException ex)
            {
                throw new InvalidOperationException($"Redis 连接失败: {ex.Message}。请检查 Redis 服务是否运行，或设置 UseInMemoryCache=true 使用内存缓存。", ex);
            }
            catch (Exception) when (enableAutoFallback)
            {
                services.AddMemoryCache();
                services.AddScoped<IRedisCacheService, MemoryCacheService>();
            }
        }

        return services;
    }
}
