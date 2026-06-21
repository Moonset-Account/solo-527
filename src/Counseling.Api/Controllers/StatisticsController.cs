using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatisticsController : ControllerBase
{
    private readonly IStatisticsService _statisticsService;

    public StatisticsController(IStatisticsService statisticsService)
    {
        _statisticsService = statisticsService;
    }

    [HttpGet("daily")]
    public async Task<ActionResult<ApiResponse<StatisticsDailyDto>>> GetDaily([FromQuery] DateTime? date)
    {
        var queryDate = date ?? DateTime.Today;
        var result = await _statisticsService.GetDailyStatisticsAsync(queryDate);
        return Ok(new ApiResponse<StatisticsDailyDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("range")]
    public async Task<ActionResult<ApiResponse<List<StatisticsDailyDto>>>> GetByDateRange(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        if (startDate > endDate)
        {
            return BadRequest(new ApiResponse<List<StatisticsDailyDto>>
            {
                Success = false,
                Message = "开始日期不能晚于结束日期，请检查日期选择",
                Code = 400
            });
        }

        var result = await _statisticsService.GetStatisticsByDateRangeAsync(startDate, endDate);
        return Ok(new ApiResponse<List<StatisticsDailyDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("attendance-rate")]
    public async Task<ActionResult<ApiResponse<decimal>>> GetAttendanceRate(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        if (startDate > endDate)
        {
            return BadRequest(new ApiResponse<decimal>
            {
                Success = false,
                Message = "开始日期不能晚于结束日期，请检查日期选择",
                Code = 400
            });
        }

        var rate = await _statisticsService.GetAttendanceRateAsync(startDate, endDate);
        return Ok(new ApiResponse<decimal>
        {
            Success = true,
            Message = $"到店率：{rate:F2}%",
            Code = 200,
            Data = rate
        });
    }

    [HttpGet("cross-department")]
    public async Task<ActionResult<ApiResponse<CrossDepartmentReportDto>>> GetCrossDepartmentReport(
        [FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate)
    {
        if (startDate > endDate)
        {
            return BadRequest(new ApiResponse<CrossDepartmentReportDto>
            {
                Success = false,
                Message = "开始日期不能晚于结束日期，请检查日期选择",
                Code = 400
            });
        }

        var result = await _statisticsService.GetCrossDepartmentReportAsync(startDate, endDate);
        return Ok(new ApiResponse<CrossDepartmentReportDto>
        {
            Success = true,
            Message = "跨部门核对数据获取成功，包含到店率、临时关店记录和最近处理记录",
            Code = 200,
            Data = result
        });
    }
}
