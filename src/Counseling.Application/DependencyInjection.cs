using Counseling.Application.Interfaces;
using Counseling.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Counseling.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ICounselorService, CounselorService>();
        services.AddScoped<IServiceItemService, ServiceItemService>();
        services.AddScoped<IAppointmentService, AppointmentService>();
        services.AddScoped<ICheckInService, CheckInService>();
        services.AddScoped<INoShowService, NoShowService>();
        services.AddScoped<IRefundService, RefundService>();
        services.AddScoped<IWaitlistService, WaitlistService>();
        services.AddScoped<IReminderService, ReminderService>();
        services.AddScoped<IStoreClosureService, StoreClosureService>();
        services.AddScoped<IStatisticsService, StatisticsService>();

        return services;
    }
}
