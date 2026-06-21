using Counseling.Application.Interfaces;
using Counseling.Domain.Interfaces;
using Counseling.Infrastructure.Caching;
using Counseling.Infrastructure.Data;
using Counseling.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace Counseling.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("DefaultConnection")));

        var redisConnectionString = configuration.GetConnectionString("RedisConnection") ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(sp =>
            ConnectionMultiplexer.Connect(redisConnectionString));
        services.AddScoped<ICacheService, RedisCacheService>();

        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<ICounselorRepository, CounselorRepository>();
        services.AddScoped<IServiceItemRepository, ServiceItemRepository>();
        services.AddScoped<ICheckInRecordRepository, CheckInRecordRepository>();
        services.AddScoped<INoShowRecordRepository, NoShowRecordRepository>();
        services.AddScoped<IRefundRecordRepository, RefundRecordRepository>();
        services.AddScoped<IWaitlistItemRepository, WaitlistItemRepository>();
        services.AddScoped<IReminderRepository, ReminderRepository>();
        services.AddScoped<IStoreClosureRepository, StoreClosureRepository>();
        services.AddScoped<IStatisticsRepository, StatisticsRepository>();

        return services;
    }
}
