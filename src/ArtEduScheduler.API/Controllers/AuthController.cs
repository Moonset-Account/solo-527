using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (result == null) return Unauthorized(new { message = "用户名或密码错误" });
        return Ok(result);
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<UserDto>> Register([FromBody] CreateUserDto dto)
    {
        try
        {
            var result = await _authService.RegisterAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
        var user = await _authService.GetUserByIdAsync(userId);
        if (user == null) return NotFound();
        return Ok(user);
    }

    [HttpGet("users")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<List<UserDto>>> GetUsersByRole([FromQuery] UserRole role)
    {
        var users = await _authService.GetUsersByRoleAsync(role);
        return Ok(users);
    }
}
