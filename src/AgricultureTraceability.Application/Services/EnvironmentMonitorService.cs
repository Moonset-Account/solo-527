using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Infrastructure.Caching;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;

namespace AgricultureTraceability.Application.Services;

public class EnvironmentMonitorService : IEnvironmentMonitorService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IRedisCacheService _redisCacheService;
    private readonly IAlertService _alertService;

    public EnvironmentMonitorService(
        IUnitOfWork unitOfWork,
        IRedisCacheService redisCacheService,
        IAlertService alertService)
    {
        _unitOfWork = unitOfWork;
        _redisCacheService = redisCacheService;
        _alertService = alertService;
    }

    public async Task<EnvironmentData> RecordDataAsync(EnvironmentData data)
    {
        data.Id = Guid.NewGuid();
        data.RecordedAt = DateTime.Now;
        var result = await _unitOfWork.EnvironmentData.AddAsync(data);
        await _unitOfWork.SaveChangesAsync();

        var cacheKey = $"env:plot:{data.PlotId}:recent";
        await _redisCacheService.RemoveAsync(cacheKey);
        await _redisCacheService.RemoveAsync("env:allplots:latest");

        await _alertService.CheckAndGenerateAlertsAsync();

        return result;
    }

    public async Task<IEnumerable<EnvironmentData>> GetRecentDataAsync(Guid plotId, int minutes = 30)
    {
        var cacheKey = $"env:plot:{plotId}:recent";
        var cached = await _redisCacheService.GetAsync<IEnumerable<EnvironmentData>>(cacheKey);
        if (cached != null && cached.Any())
        {
            return cached;
        }

        var startTime = DateTime.Now.AddMinutes(-minutes);
        var allData = await _unitOfWork.EnvironmentData.GetAllAsync();
        var data = allData
            .Where(e => e.PlotId == plotId && e.RecordedAt >= startTime)
            .OrderByDescending(e => e.RecordedAt)
            .ToList();

        await _redisCacheService.SetAsync(cacheKey, data, TimeSpan.FromMinutes(5));
        return data;
    }

    public async Task<IEnumerable<EnvironmentData>> GetAllPlotsLatestDataAsync()
    {
        var cacheKey = "env:allplots:latest";
        var cached = await _redisCacheService.GetAsync<IEnumerable<EnvironmentData>>(cacheKey);
        if (cached != null && cached.Any())
        {
            return cached;
        }

        var allData = await _unitOfWork.EnvironmentData.GetAllAsync();
        var latestPerPlot = allData
            .GroupBy(e => e.PlotId)
            .Select(g => g.OrderByDescending(e => e.RecordedAt).FirstOrDefault())
            .Where(e => e != null)
            .ToList()!;

        await _redisCacheService.SetAsync(cacheKey, latestPerPlot, TimeSpan.FromMinutes(3));
        return latestPerPlot;
    }
}
