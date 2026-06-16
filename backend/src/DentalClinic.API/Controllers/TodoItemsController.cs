
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TodoItemsController : ControllerBase
{
    private readonly ITodoItemService _todoItemService;

    public TodoItemsController(ITodoItemService todoItemService)
    {
        _todoItemService = todoItemService;
    }

    [HttpGet]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;PagedResultDto&lt;TodoItemDto&gt;&gt;&gt;&gt; GetList([FromQuery] TodoQueryDto query)
    {
        var result = await _todoItemService.GetListAsync(query);
        return Ok(new ApiResultDto&lt;PagedResultDto&lt;TodoItemDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;TodoItemDto&gt;&gt;&gt; GetById(int id, [FromQuery] bool includeDetails = true)
    {
        var todo = await _todoItemService.GetByIdAsync(id, includeDetails);
        if (todo == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "待办不存在" });

        return Ok(new ApiResultDto&lt;TodoItemDto&gt;
        {
            Success = true,
            Code = 200,
            Data = todo
        });
    }

    [HttpPost]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;TodoItemDto&gt;&gt;&gt; Create(TodoItemCreateDto dto)
    {
        var result = await _todoItemService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto&lt;TodoItemDto&gt;
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;TodoItemDto&gt;&gt;&gt; Update(int id, TodoItemUpdateDto dto)
    {
        var result = await _todoItemService.UpdateAsync(id, dto);
        if (result == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "待办不存在" });

        return Ok(new ApiResultDto&lt;TodoItemDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpDelete("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&gt;&gt; Delete(int id)
    {
        var result = await _todoItemService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "待办不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "删除成功" });
    }

    [HttpPost("{id}/complete")]
    public async Task&lt;ActionResult&lt;ApiResultDto&gt;&gt; Complete(int id)
    {
        var result = await _todoItemService.CompleteAsync(id);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "待办不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "完成成功" });
    }

    [HttpGet("pending/count")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;int&gt;&gt;&gt; GetPendingCount([FromQuery] int? assignedToUserId = null)
    {
        var count = await _todoItemService.GetPendingCountAsync(assignedToUserId);
        return Ok(new ApiResultDto&lt;int&gt;
        {
            Success = true,
            Code = 200,
            Data = count
        });
    }
}
