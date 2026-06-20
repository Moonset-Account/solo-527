
using Microsoft.Extensions.DependencyInjection;
using TicketCounter.Application.Interfaces;
using TicketCounter.Application.Services;
using TicketCounter.Infrastructure.Cache;
using TicketCounter.Infrastructure.Repositories;

namespace TicketCounter.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<ISessionService, SessionService>();
        services.AddScoped<ISeatService, SeatService>();
        services.AddScoped<ITicketStockService, TicketStockService>();
        services.AddScoped<IRegistrationService, RegistrationService>();
        services.AddScoped<ITodoService, TodoService>();
        services.AddScoped<IOperationLogService, OperationLogService>();
        services.AddScoped<IApiRetryService, ApiRetryService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IRedisCacheService, RedisCacheService>();
        services.AddAutoMapper(AppDomain.CurrentDomain.GetAssemblies());
        return services;
    }
}
