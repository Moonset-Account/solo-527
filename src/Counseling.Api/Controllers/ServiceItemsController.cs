using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServiceItemsController : ControllerBase
{
    private readonly IServiceItemService _service;

    public ServiceItemsController(IServiceItemService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ServiceItemDto>>>> GetAll()
    {
        var result = await _service.GetAllAsync();
        return Ok(new ApiResponse<List<ServiceItemDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("active")]
    public async Task<ActionResult<ApiResponse<List<ServiceItemDto>>>> GetActive()
    {
        var result = await _service.GetActiveAsync();
        return Ok(new ApiResponse<List<ServiceItemDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ServiceItemDto>>> GetById(int id)
    {
        var result = await _service.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<ServiceItemDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的服务项目，请检查服务ID是否正确",
                Code = 404
            });
        }
        return Ok(new ApiResponse<ServiceItemDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ServiceItemDto>>> Create([FromBody] ServiceItemCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new ApiResponse<ServiceItemDto>
            {
                Success = false,
                Message = "服务项目名称不能为空，请填写服务名称",
                Code = 400
            });

        if (dto.Price <= 0)
            return BadRequest(new ApiResponse<ServiceItemDto>
            {
                Success = false,
                Message = "服务价格必须大于0，请设置合理的价格",
                Code = 400
            });

        if (dto.DurationMinutes <= 0)
            return BadRequest(new ApiResponse<ServiceItemDto>
            {
                Success = false,
                Message = "服务时长必须大于0分钟，请设置合理的服务时长",
                Code = 400
            });

        var result = await _service.CreateAsync(dto, "system");
        return Ok(new ApiResponse<ServiceItemDto>
        {
            Success = true,
            Message = "服务项目创建成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] ServiceItemUpdateDto dto)
    {
        await _service.UpdateAsync(id, dto, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "服务项目已更新成功",
            Code = 200
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _service.DeleteAsync(id, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "服务项目已删除成功",
            Code = 200
        });
    }

    [HttpGet("privacy/{level}")]
    public async Task<ActionResult<ApiResponse<List<ServiceItemDto>>>> GetByPrivacyLevel(PrivacyLevel level)
    {
        var result = await _service.GetByPrivacyLevelAsync(level);
        return Ok(new ApiResponse<List<ServiceItemDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }
}
