
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FollowUpsController : ControllerBase
{
    private readonly IFollowUpService _followUpService;

    public FollowUpsController(IFollowUpService followUpService)
    {
        _followUpService = followUpService;
    }

    [HttpGet]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PagedResultDto&lt;FollowUpDto&gt;&gt;&gt;&gt; GetList([FromQuery] FollowUpQueryDto query)
    {
        var result = await _followUpService.GetListAsync(query);
        return Ok(new ApiResultDto&lt;PagedResultDto&lt;FollowUpDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;FollowUpDto&gt;&gt;&gt; GetById(int id)
    {
        var followUp = await _followUpService.GetByIdAsync(id);
        if (followUp == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "随访记录不存在" });

        return Ok(new ApiResultDto&lt;FollowUpDto&gt;
        {
            Success = true,
            Code = 200,
            Data = followUp
        });
    }

    [HttpPost]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;FollowUpDto&gt;&gt;&gt; Create(FollowUpCreateDto dto)
    {
        var result = await _followUpService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto&lt;FollowUpDto&gt;
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;FollowUpDto&gt;&gt;&gt; Update(int id, FollowUpUpdateDto dto)
    {
        var result = await _followUpService.UpdateAsync(id, dto);
        if (result == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "随访记录不存在" });

        return Ok(new ApiResultDto&lt;FollowUpDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpDelete("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&gt;&gt; Delete(int id)
    {
        var result = await _followUpService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "随访记录不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "取消成功" });
    }

    [HttpPost("{id}/complete")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;FollowUpDto&gt;&gt;&gt; Complete(int id, [FromBody] CompleteFollowUpDto dto)
    {
        var result = await _followUpService.CompleteAsync(id, dto.Result, dto.Remark);
        if (result == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "随访记录不存在" });

        return Ok(new ApiResultDto&lt;FollowUpDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result,
            Message = "办结成功，已同步到排班负荷报表"
        });
    }

    [HttpGet("overdue/count")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;int&gt;&gt;&gt; GetOverdueCount([FromQuery] int? responsiblePersonId = null)
    {
        var count = await _followUpService.GetOverdueCountAsync(responsiblePersonId);
        return Ok(new ApiResultDto&lt;int&gt;
        {
            Success = true,
            Code = 200,
            Data = count
        });
    }
}

public class CompleteFollowUpDto
{
    public string Result { get; set; } = string.Empty;
    public string? Remark { get; set; }
}
