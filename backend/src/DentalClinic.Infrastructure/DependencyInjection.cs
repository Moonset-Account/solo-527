
using DentalClinic.Application.Interfaces;
using DentalClinic.Infrastructure.Caching;
using DentalClinic.Infrastructure.Data;
using DentalClinic.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using StackExchange.Redis;

namespace DentalClinic.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b => b.MigrationsAssembly("DentalClinic.Infrastructure")));

        var redisConnectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(sp =>
            ConnectionMultiplexer.Connect(redisConnectionString));

        services.AddScoped<ICacheService, RedisCacheService>();

        services.AddScoped<IPatientService, PatientService>();
        services.AddScoped<IDoctorService, DoctorService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<IFollowUpService, FollowUpService>();
        services.AddScoped<IScheduleSlotService, ScheduleSlotService>();
        services.AddScoped<ITodoItemService, TodoItemService>();
        services.AddScoped<IStatisticsService, StatisticsService>();
        services.AddScoped<IExternalApiLogService, ExternalApiLogService>();
        services.AddScoped<IWorkloadReportService, WorkloadReportService>();
        services.AddScoped<IPrescriptionService, PrescriptionService>();
        services.AddScoped<IChiefComplaintService, ChiefComplaintService>();
        services.AddScoped<IFeeItemService, FeeItemService>();

        services.AddHttpClient<IExternalApiService, ExternalApiService>();

        return services;
    }
}
