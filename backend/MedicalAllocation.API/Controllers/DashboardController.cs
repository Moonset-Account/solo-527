using System.Text.Json;
using System.Text.Json.Serialization;
using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

namespace MedicalAllocation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _dashboardService;
    private readonly IDistributedCache _cache;

    public DashboardController(IDashboardService dashboardService, IDistributedCache cache)
    {
        _dashboardService = dashboardService;
        _cache = cache;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDTO>> GetStats(CancellationToken cancellationToken)
    {
        const string cacheKey = "dashboard:stats";
        var cachedData = await _cache.GetStringAsync(cacheKey, cancellationToken);
        if (!string.IsNullOrEmpty(cachedData))
        {
            var stats = JsonSerializer.Deserialize<DashboardStatsDTO>(cachedData);
            if (stats != null)
            {
                return Ok(new { success = true, data = stats, message = (string?)null });
            }
        }

        var result = await _dashboardService.GetDashboardStatsAsync(cancellationToken);
        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
        };
        await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), options, cancellationToken);
        return Ok(new { success = true, data = result, message = (string?)null });
    }

    [HttpGet("safety-stock")]
    public async Task<ActionResult<IEnumerable<SafetyStockDashboardDTO>>> GetSafetyStock([FromQuery] int? warehouseId, CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetSafetyStockAlertsAsync(warehouseId, cancellationToken);
        return Ok(new { success = true, data = result, message = (string?)null });
    }

    [HttpGet("high-risk-medicines")]
    public async Task<ActionResult<IEnumerable<SafetyStockDashboardDTO>>> GetHighRiskMedicines([FromQuery] int take = 20, CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetHighRiskMedicinesAsync(take, cancellationToken);
        return Ok(new { success = true, data = result, message = (string?)null });
    }

    [HttpGet("stockout-trend")]
    public async Task<ActionResult<IEnumerable<StockoutTrendPointDTO>>> GetStockoutTrend([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetStockoutRiskTrendAsync(startDate, endDate, cancellationToken);
        return Ok(new { success = true, data = result, message = (string?)null });
    }

    [HttpGet("category-stock")]
    public async Task<ActionResult<IEnumerable<CategoryStockDTO>>> GetCategoryStock(CancellationToken cancellationToken)
    {
        var result = await _dashboardService.GetCategoryStockSummaryAsync(cancellationToken);
        return Ok(new { success = true, data = result, message = (string?)null });
    }

    [HttpPost("generate-trend")]
    public async Task<IActionResult> GenerateTrend(CancellationToken cancellationToken)
    {
        await _dashboardService.GenerateStockoutRiskTrendAsync(cancellationToken);
        return Ok(new { success = true, message = (string?)null });
    }
}
