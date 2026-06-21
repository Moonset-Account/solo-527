using Microsoft.Extensions.DependencyInjection;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Application.Services;

namespace ProcessScheduling.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEquipmentService, EquipmentService>();
        services.AddScoped<IProcessStepService, ProcessStepService>();
        services.AddScoped<IWorkReportService, WorkReportService>();
        services.AddScoped<IStatisticsService, StatisticsService>();
        services.AddScoped<IDowntimeService, DowntimeService>();
        services.AddScoped<IWorkOrderService, WorkOrderService>();
        services.AddScoped<IOperationLogService, OperationLogService>();
        services.AddScoped<IReviewService, ReviewService>();

        return services;
    }
}
