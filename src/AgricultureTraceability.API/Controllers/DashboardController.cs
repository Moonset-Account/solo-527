using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DashboardController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public DashboardController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetStats()
    {
        var plots = await _unitOfWork.Plots.GetAllAsync();
        var batches = await _unitOfWork.HarvestBatches.GetAllAsync();
        var alerts = await _unitOfWork.Alerts.GetAllAsync();
        var materials = await _unitOfWork.ApplicationMaterials.GetAllAsync();
        var orders = await _unitOfWork.Orders.GetAllAsync();

        var today = DateTime.Today;
        var todayHarvestBatches = batches.Where(b =>
            b.HarvestDate.HasValue &&
            b.HarvestDate.Value.Date == today
        );

        var stats = new DashboardStatsDto
        {
            ActivePlots = plots.Count(p => p.IsActive),
            ActiveBatches = batches.Count(b => b.Status == BatchStatus.Harvesting || b.Status == BatchStatus.Pending),
            ActiveAlerts = alerts.Count(a => a.Status != AlertStatus.Resolved),
            TodayHarvestWeight = todayHarvestBatches.Sum(b => b.ActualYield),
            MaterialMissingCount = materials.Count(m => m.Status == MaterialStatus.Missing),
            PendingOrdersCount = orders.Count(o => o.Status == OrderStatus.Created || o.Status == OrderStatus.Fulfilling)
        };

        return Ok(stats);
    }
}
