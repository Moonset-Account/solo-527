
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GridEventManagement.Web.DTOs;
using GridEventManagement.Web.Services;

namespace GridEventManagement.Web.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TodosController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TodosController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResultDto<TodoDto>>> GetPagedTodos([FromQuery] TodoQueryDto query)
    {
        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;

        if (currentUserRole != "admin" && currentUserRole != "manager")
        {
            query.UserId = currentUserId;
        }

        var result = await _taskService.GetPagedTodosAsync(query);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TodoDto>> GetTodoById(int id)
    {
        var todo = await _taskService.GetTodoByIdAsync(id);
        if (todo == null)
        {
            return NotFound();
        }

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentUserRole != "admin" && currentUserRole != "manager" && todo.UserId != currentUserId)
        {
            return Forbid();
        }

        return Ok(todo);
    }

    [HttpPost]
    [Authorize(Roles = "admin,manager")]
    public async Task<ActionResult<TodoDto>> CreateTodo([FromBody] CreateTodoDto request)
    {
        var result = await _taskService.CreateTodoAsync(request);
        return CreatedAtAction(nameof(GetTodoById), new { id = result.Id }, result);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<TodoDto>> UpdateTodo(int id, [FromBody] UpdateTodoDto request)
    {
        var todo = await _taskService.GetTodoByIdAsync(id);
        if (todo == null)
        {
            return NotFound();
        }

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentUserRole != "admin" && currentUserRole != "manager" && todo.UserId != currentUserId)
        {
            return Forbid();
        }

        var result = await _taskService.UpdateTodoAsync(id, request);
        return Ok(result);
    }

    [HttpPut("{id:int}/complete")]
    public async Task<ActionResult<TodoDto>> CompleteTodo(int id)
    {
        var todo = await _taskService.GetTodoByIdAsync(id);
        if (todo == null)
        {
            return NotFound();
        }

        var currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var currentUserRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (currentUserRole != "admin" && currentUserRole != "manager" && todo.UserId != currentUserId)
        {
            return Forbid();
        }

        var result = await _taskService.CompleteTodoAsync(id);
        return Ok(result);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin,manager")]
    public async Task<IActionResult> DeleteTodo(int id)
    {
        var result = await _taskService.DeleteTodoAsync(id);
        if (!result)
        {
            return NotFound();
        }
        return NoContent();
    }
}
