using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoreClosuresController : ControllerBase
{
    private readonly IStoreClosureService _storeClosureService;

    public StoreClosuresController(IStoreClosureService storeClosureService)
    {
        _storeClosureService = storeClosureService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<StoreClosureDto>>>> GetByDateRange(
        [FromQuery] DateTime? startDate,
        [FromQuery] DateTime? endDate)
    {
        var start = startDate ?? DateTime.Today;
        var end = endDate ?? DateTime.Today.AddMonths(1);
        var result = await _storeClosureService.GetByDateRangeAsync(start, end);
        return Ok(new ApiResponse<List<StoreClosureDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<List<StoreClosureDto>>>> GetActive([FromQuery] DateTime? date)
    {
        var queryDate = date ?? DateTime.Today;
        var result = await _storeClosureService.GetActiveClosuresAsync(queryDate);
        return Ok(new ApiResponse<List<StoreClosureDto>>
        {
            Success = true,
            Message = result.Any() ? $"当天有 {result.Count} 条关店记录" : "当天正常营业",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<StoreClosureDto>>> GetById(int id)
    {
        var result = await _storeClosureService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<StoreClosureDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的关店记录",
                Code = 404
            });
        }
        return Ok(new ApiResponse<StoreClosureDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("check-closed")]
    public async Task<ActionResult<ApiResponse<bool>>> IsStoreClosed([FromQuery] DateTime date, [FromQuery] TimeSpan time)
    {
        var isClosed = await _storeClosureService.IsStoreClosedAsync(date, time);
        return Ok(new ApiResponse<bool>
        {
            Success = true,
            Message = isClosed ? "该时段店铺已关闭" : "该时段正常营业",
            Code = 200,
            Data = isClosed
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<StoreClosureDto>>> Create([FromBody] StoreClosureCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new ApiResponse<StoreClosureDto>
            {
                Success = false,
                Message = "请填写关店原因，这对通知来访者和跨部门核对都很重要",
                Code = 400
            });
        }

        if (!dto.IsFullDay && (!dto.StartTime.HasValue || !dto.EndTime.HasValue))
        {
            return BadRequest(new ApiResponse<StoreClosureDto>
            {
                Success = false,
                Message = "非全天关店必须设置开始和结束时间",
                Code = 400
            });
        }

        if (!dto.IsFullDay && dto.StartTime >= dto.EndTime)
        {
            return BadRequest(new ApiResponse<StoreClosureDto>
            {
                Success = false,
                Message = "关店开始时间必须早于结束时间",
                Code = 400
            });
        }

        var result = await _storeClosureService.CreateAsync(dto, "system");
        return Ok(new ApiResponse<StoreClosureDto>
        {
            Success = true,
            Message = "关店记录已创建，系统会自动通知受影响的预约客户",
            Code = 200,
            Data = result
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _storeClosureService.DeleteAsync(id, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "关店记录已删除，该时段恢复正常营业",
            Code = 200
        });
    }
}
