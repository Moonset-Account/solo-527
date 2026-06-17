using AgricultureTraceability.API.Hubs;
using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace AgricultureTraceability.Application.Services;

public class AlertService : IAlertService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IHubContext<AlertHub>? _hubContext;

    public AlertService(IUnitOfWork unitOfWork, IHubContext<AlertHub>? hubContext = null)
    {
        _unitOfWork = unitOfWork;
        _hubContext = hubContext;
    }

    public async Task CheckAndGenerateAlertsAsync()
    {
        var plots = await _unitOfWork.Plots.GetAllAsync();
        var allThresholds = (await _unitOfWork.Thresholds.GetAllAsync()).ToList();
        var globalThresholds = allThresholds.Where(t => t.PlotId == null).ToList();
        var activeAlerts = (await GetActiveAlertsAsync()).ToList();
        var allEnvData = await _unitOfWork.EnvironmentData.GetAllAsync();

        var newAlerts = new List<Alert>();

        foreach (var plot in plots)
        {
            var plotLatestData = allEnvData
                .Where(e => e.PlotId == plot.Id)
                .OrderByDescending(e => e.RecordedAt)
                .FirstOrDefault();

            if (plotLatestData == null) continue;

            var plotThresholds = allThresholds.Where(t => t.PlotId == plot.Id).ToList();
            var effectiveThresholds = new List<Threshold>();

            var parameterTypes = new[] { "Temperature", "Humidity", "SoilMoisture", "LightIntensity", "Co2Level" };
            foreach (var pt in parameterTypes)
            {
                var plotTh = plotThresholds.FirstOrDefault(t => t.ParameterType == pt);
                if (plotTh != null)
                    effectiveThresholds.Add(plotTh);
                else
                {
                    var globalTh = globalThresholds.FirstOrDefault(t => t.ParameterType == pt);
                    if (globalTh != null)
                        effectiveThresholds.Add(globalTh);
                }
            }

            var parameters = new Dictionary<string, decimal>
            {
                ["Temperature"] = plotLatestData.Temperature,
                ["Humidity"] = plotLatestData.Humidity,
                ["SoilMoisture"] = plotLatestData.SoilMoisture,
                ["LightIntensity"] = plotLatestData.LightIntensity,
                ["Co2Level"] = plotLatestData.Co2Level
            };

            foreach (var threshold in effectiveThresholds)
            {
                if (!parameters.ContainsKey(threshold.ParameterType!)) continue;
                var currentValue = parameters[threshold.ParameterType!];
                var isOutOfRange = currentValue < threshold.MinValue || currentValue > threshold.MaxValue;

                if (!isOutOfRange) continue;

                var existingActive = activeAlerts.FirstOrDefault(a =>
                    a.PlotId == plot.Id &&
                    a.ParameterType == threshold.ParameterType &&
                    a.Status == AlertStatus.Active);

                if (existingActive != null) continue;

                var isMin = currentValue < threshold.MinValue;
                var thresholdValue = isMin ? threshold.MinValue : threshold.MaxValue;
                var deviationPercent = thresholdValue != 0
                    ? Math.Abs(currentValue - thresholdValue) / Math.Abs(thresholdValue) * 100
                    : 0;

                var level = deviationPercent >= 20 ? AlertLevel.Critical
                    : deviationPercent >= 10 ? AlertLevel.Warning
                    : AlertLevel.Info;

                var direction = isMin ? "低于" : "高于";
                var message = $"地块[{plot.Name}] {threshold.ParameterType} {direction}阈值：当前值 {currentValue:F2}，阈值 {thresholdValue:F2}";

                var alert = new Alert
                {
                    Id = Guid.NewGuid(),
                    ParameterType = threshold.ParameterType,
                    Level = level,
                    Status = AlertStatus.Active,
                    PlotId = plot.Id,
                    CurrentValue = currentValue,
                    ThresholdValue = thresholdValue,
                    Message = message,
                    TriggeredAt = DateTime.Now
                };

                newAlerts.Add(alert);
            }
        }

        foreach (var alert in newAlerts)
        {
            await _unitOfWork.Alerts.AddAsync(alert);
        }

        await _unitOfWork.SaveChangesAsync();

        if (_hubContext != null && newAlerts.Count > 0)
        {
            foreach (var alert in newAlerts)
            {
                await _hubContext.Clients.All.SendAsync("ReceiveAlert", alert);
            }
        }
    }

    public async Task AcknowledgeAlertAsync(Guid alertId, Guid userId)
    {
        var alert = await _unitOfWork.Alerts.GetByIdAsync(alertId);
        if (alert != null)
        {
            alert.Status = AlertStatus.Acknowledged;
            alert.AcknowledgedAt = DateTime.Now;
            alert.AcknowledgedBy = userId;
            _unitOfWork.Alerts.Update(alert);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task ResolveAlertAsync(Guid alertId, Guid userId)
    {
        var alert = await _unitOfWork.Alerts.GetByIdAsync(alertId);
        if (alert != null)
        {
            alert.Status = AlertStatus.Resolved;
            if (alert.AcknowledgedAt == null)
            {
                alert.AcknowledgedAt = DateTime.Now;
                alert.AcknowledgedBy = userId;
            }
            _unitOfWork.Alerts.Update(alert);
            await _unitOfWork.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<Alert>> GetActiveAlertsAsync()
    {
        var all = await _unitOfWork.Alerts.GetAllAsync();
        return all.Where(a => a.Status == AlertStatus.Active).ToList();
    }

    public async Task<Alert?> GetByIdAsync(Guid id)
    {
        return await _unitOfWork.Alerts.GetByIdAsync(id);
    }
}
