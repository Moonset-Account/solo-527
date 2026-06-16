
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
        services.AddDbContext&lt;AppDbContext&gt;(options =&gt;
            options.UseSqlServer(
                configuration.GetConnectionString("DefaultConnection"),
                b =&gt; b.MigrationsAssembly("DentalClinic.Infrastructure")));

        var redisConnectionString = configuration.GetConnectionString("Redis") ?? "localhost:6379";
        services.AddSingleton&lt;IConnectionMultiplexer&gt;(sp =&gt;
            ConnectionMultiplexer.Connect(redisConnectionString));

        services.AddScoped&lt;ICacheService, RedisCacheService&gt;();

        services.AddScoped&lt;IPatientService, PatientService&gt;();
        services.AddScoped&lt;IDoctorService, DoctorService&gt;();
        services.AddScoped&lt;IAppointmentService, AppointmentService&gt;();
        services.AddScoped&lt;IFollowUpService, FollowUpService&gt;();
        services.AddScoped&lt;IScheduleSlotService, ScheduleSlotService&gt;();
        services.AddScoped&lt;ITodoItemService, TodoItemService&gt;();
        services.AddScoped&lt;IStatisticsService, StatisticsService&gt;();
        services.AddScoped&lt;IExternalApiLogService, ExternalApiLogService&gt;();
        services.AddScoped&lt;IWorkloadReportService, WorkloadReportService&gt;();
        services.AddScoped&lt;IPrescriptionService, PrescriptionService&gt;();
        services.AddScoped&lt;IChiefComplaintService, ChiefComplaintService&gt;();
        services.AddScoped&lt;IFeeItemService, FeeItemService&gt;();

        services.AddHttpClient&lt;IExternalApiService, ExternalApiService&gt;();

        return services;
    }
}
