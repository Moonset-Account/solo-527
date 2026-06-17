using OpsWorkOrder.Services;

namespace OpsWorkOrder.BackgroundServices;

public class VulnerabilityOverdueChecker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<VulnerabilityOverdueChecker> _logger;

    public VulnerabilityOverdueChecker(IServiceProvider serviceProvider, ILogger<VulnerabilityOverdueChecker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Vulnerability Overdue Checker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var service = scope.ServiceProvider.GetRequiredService<IVulnerabilityService>();
                await service.CheckOverdueAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking overdue vulnerabilities.");
            }

            await Task.Delay(TimeSpan.FromHours(1), stoppingToken);
        }

        _logger.LogInformation("Vulnerability Overdue Checker is stopping.");
    }
}

public class AlertOverdueChecker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<AlertOverdueChecker> _logger;

    public AlertOverdueChecker(IServiceProvider serviceProvider, ILogger<AlertOverdueChecker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Alert Overdue Checker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<OpsWorkOrder.Data.AppDbContext>();
                var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                var now = DateTime.UtcNow;
                var overdueAlerts = await context.Alerts
                    .Where(a => !a.IsOverdue && a.DueDate.HasValue && a.DueDate.Value < now
                        && a.Status != OpsWorkOrder.Enums.AlertStatus.Closed
                        && a.Status != OpsWorkOrder.Enums.AlertStatus.Resolved)
                    .ToListAsync(cancellationToken);

                foreach (var alert in overdueAlerts)
                {
                    alert.IsOverdue = true;

                    if (alert.AssignedToId.HasValue)
                    {
                        await notificationService.CreateAsync(
                            alert.AssignedToId.Value,
                            OpsWorkOrder.Enums.NotificationType.AlertOverdue,
                            "告警超期提醒",
                            $"告警【{alert.Title}】已超期，请尽快处理。",
                            alert.Id.ToString(),
                            "Alert");
                    }
                }

                await context.SaveChangesAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking overdue alerts.");
            }

            await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
        }

        _logger.LogInformation("Alert Overdue Checker is stopping.");
    }
}
