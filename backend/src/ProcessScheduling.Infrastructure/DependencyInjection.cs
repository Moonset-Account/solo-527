using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

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
        if (!string.IsNullOrEmpty(redisConnectionString))
        {
            services.AddSingleton<IConnectionMultiplexer>(sp =>
                ConnectionMultiplexer.Connect(redisConnectionString));
            services.AddScoped<IRedisCacheService, RedisCacheService>();
        }

        return services;
    }
}
