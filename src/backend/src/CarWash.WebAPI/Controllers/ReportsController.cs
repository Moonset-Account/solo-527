using Microsoft.AspNetCore.Mvc;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    [HttpGet("conversion")]
    public async Task<IActionResult> GetConversionReport([FromQuery] string period = "day", [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = new[]
        {
            new
            {
                period = DateTime.Now.ToString("yyyy-MM-dd"),
                totalAppointments = 50,
                arrivedCount = 42,
                arrivalRate = 0.84,
                completedCount = 40,
                completionRate = 0.80,
                avgRevenue = 128.5m
            },
            new
            {
                period = DateTime.Now.AddDays(-1).ToString("yyyy-MM-dd"),
                totalAppointments = 45,
                arrivedCount = 38,
                arrivalRate = 0.844,
                completedCount = 36,
                completionRate = 0.80,
                avgRevenue = 135.2m
            }
        };

        return Ok(result);
    }

    [HttpGet("conversion/funnel")]
    public async Task<IActionResult> GetConversionFunnel([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = new
        {
            views = 1000,
            viewRate = 1.0,
            appointments = 200,
            appointmentRate = 0.20,
            arrivals = 168,
            arrivalRate = 0.84,
            upsales = 42,
            upsaleRate = 0.25
        };

        return Ok(result);
    }

    [HttpGet("technicians/performance")]
    public async Task<IActionResult> GetTechnicianPerformance([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = new[]
        {
            new
            {
                technicianId = Guid.NewGuid().ToString(),
                technicianName = "张师傅",
                serviceCount = 45,
                revenue = 5400.00m,
                rating = 4.8
            },
            new
            {
                technicianId = Guid.NewGuid().ToString(),
                technicianName = "李师傅",
                serviceCount = 38,
                revenue = 4560.00m,
                rating = 4.9
            },
            new
            {
                technicianId = Guid.NewGuid().ToString(),
                technicianName = "王师傅",
                serviceCount = 42,
                revenue = 5040.00m,
                rating = 4.7
            }
        };

        return Ok(result);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardReport()
    {
        var result = new
        {
            today = new
            {
                totalAppointments = 50,
                arrivedCount = 12,
                inServiceCount = 8,
                completedCount = 5,
                revenue = 1250.00m
            },
            technicians = new[]
            {
                new { id = Guid.NewGuid().ToString(), name = "张师傅", status = "busy", currentService = "精洗套餐" },
                new { id = Guid.NewGuid().ToString(), name = "李师傅", status = "available", currentService = (string?)null }
            },
            workstations = new[]
            {
                new { id = Guid.NewGuid().ToString(), name = "1号工位", status = "occupied", type = "wash" },
                new { id = Guid.NewGuid().ToString(), name = "2号工位", status = "idle", type = "detail" }
            },
            recentAppointments = new[]
            {
                new { id = Guid.NewGuid().ToString(), customerName = "王先生", service = "精洗套餐", status = "in_service", time = "10:30" }
            }
        };

        return Ok(result);
    }

    [HttpGet("revenue")]
    public async Task<IActionResult> GetRevenueReport([FromQuery] string period = "day", [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = new[]
        {
            new { date = DateTime.Now.ToString("yyyy-MM-dd"), revenue = 2580.00m, orderCount = 25 },
            new { date = DateTime.Now.AddDays(-1).ToString("yyyy-MM-dd"), revenue = 3120.00m, orderCount = 30 }
        };

        return Ok(result);
    }

    [HttpGet("service-popularity")]
    public async Task<IActionResult> GetServicePopularity([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var result = new[]
        {
            new { serviceName = "精洗套餐", count = 85, revenue = 8491.50m },
            new { serviceName = "内饰清洁", count = 42, revenue = 5031.60m },
            new { serviceName = "打蜡服务", count = 28, revenue = 4194.40m }
        };

        return Ok(result);
    }
}
