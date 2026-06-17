using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Domain.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<User>>> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<User>> GetUserById(Guid id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }
        return Ok(user);
    }

    [HttpGet("role/{role}")]
    public async Task<ActionResult<IEnumerable<User>>> GetUsersByRole(UserRole role)
    {
        var users = await _userService.GetUsersByRoleAsync(role);
        return Ok(users);
    }
}
