using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CounselorsController : ControllerBase
{
    private readonly ICounselorService _counselorService;

    public CounselorsController(ICounselorService counselorService)
    {
        _counselorService = counselorService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<CounselorDto>>>> GetAll()
    {
        var result = await _counselorService.GetAllAsync();
        return Ok(new ApiResponse<List<CounselorDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<CounselorDto>>> GetById(int id)
    {
        var result = await _counselorService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<CounselorDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的咨询师，请检查咨询师ID是否正确",
                Code = 404
            });
        }
        return Ok(new ApiResponse<CounselorDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("service/{serviceItemId}")]
    public async Task<ActionResult<ApiResponse<List<CounselorDto>>>> GetByServiceItem(int serviceItemId)
    {
        var result = await _counselorService.GetByServiceItemIdAsync(serviceItemId);
        return Ok(new ApiResponse<List<CounselorDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("available")]
    public async Task<ActionResult<ApiResponse<List<CounselorDto>>>> GetAvailable(
        [FromQuery] DateTime date,
        [FromQuery] TimeSpan startTime,
        [FromQuery] TimeSpan endTime)
    {
        var result = await _counselorService.GetAvailableAsync(date, startTime, endTime);
        return Ok(new ApiResponse<List<CounselorDto>>
        {
            Success = true,
            Message = $"找到 {result.Count} 位可预约的咨询师",
            Code = 200,
            Data = result
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<CounselorDto>>> Create([FromBody] CounselorCreateDto dto)
    {
        if (dto.UserId <= 0)
            return BadRequest(new ApiResponse<CounselorDto>
            {
                Success = false,
                Message = "请选择关联的用户账号",
                Code = 400
            });

        if (string.IsNullOrWhiteSpace(dto.Title))
            return BadRequest(new ApiResponse<CounselorDto>
            {
                Success = false,
                Message = "请填写咨询师职称，如：心理咨询师、高级咨询师等",
                Code = 400
            });

        if (string.IsNullOrWhiteSpace(dto.Specialties))
            return BadRequest(new ApiResponse<CounselorDto>
            {
                Success = false,
                Message = "请填写咨询师擅长领域，方便来访者选择",
                Code = 400
            });

        var result = await _counselorService.CreateAsync(dto, "system");
        return Ok(new ApiResponse<CounselorDto>
        {
            Success = true,
            Message = "咨询师档案创建成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] CounselorCreateDto dto)
    {
        await _counselorService.UpdateAsync(id, dto, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "咨询师信息已更新成功",
            Code = 200
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _counselorService.DeleteAsync(id, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "咨询师档案已删除成功",
            Code = 200
        });
    }
}
