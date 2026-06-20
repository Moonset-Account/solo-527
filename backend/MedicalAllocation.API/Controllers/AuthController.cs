using System.Security.Claims;
using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace MedicalAllocation.API.Controllers;

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
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await _authService.LoginAsync(request, cancellationToken);
        if (result == null)
        {
            return Unauthorized(new { success = false, data = (LoginResponse?)null, message = "用户名或密码错误" });
        }
        return Ok(new { success = true, data = result, message = (string?)null });
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpGet("users")]
    public async Task<ActionResult<IEnumerable<UserDTO>>> GetUsers(CancellationToken cancellationToken)
    {
        var users = await _authService.GetAllUsersAsync(cancellationToken);
        return Ok(new { success = true, data = users, message = (string?)null });
    }

    [Authorize]
    [HttpGet("users/{id:int}")]
    public async Task<ActionResult<UserDTO>> GetUserById(int id, CancellationToken cancellationToken)
    {
        var user = await _authService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return NotFound(new { success = false, data = (UserDTO?)null, message = "用户不存在" });
        }
        return Ok(new { success = true, data = user, message = (string?)null });
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPost("users")]
    public async Task<ActionResult<UserDTO>> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var created = await _authService.CreateUserAsync(request.User, request.Password, cancellationToken);
        return CreatedAtAction(nameof(GetUserById), new { id = created.Id }, new { success = true, data = created, message = (string?)null });
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPut("users")]
    public async Task<ActionResult<UserDTO>> UpdateUser([FromBody] UserDTO userDto, CancellationToken cancellationToken)
    {
        var updated = await _authService.UpdateUserAsync(userDto, cancellationToken);
        if (updated == null)
        {
            return NotFound(new { success = false, data = (UserDTO?)null, message = "用户不存在" });
        }
        return Ok(new { success = true, data = updated, message = (string?)null });
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id, CancellationToken cancellationToken)
    {
        var result = await _authService.DeleteUserAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound(new { success = false, message = "用户不存在" });
        }
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<ActionResult<bool>> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
        {
            return Unauthorized(new { success = false, data = false, message = "用户未认证" });
        }
        var result = await _authService.ChangePasswordAsync(userId, request.OldPassword, request.NewPassword, cancellationToken);
        return Ok(new { success = result, data = result, message = result ? (string?)null : "修改密码失败" });
    }

    [Authorize(Roles = nameof(UserRole.Admin))]
    [HttpPost("users/{id:int}/toggle-active")]
    public async Task<ActionResult<bool>> ToggleUserActive(int id, CancellationToken cancellationToken)
    {
        var result = await _authService.ToggleUserActiveAsync(id, cancellationToken);
        if (!result)
        {
            return NotFound(new { success = false, data = false, message = "用户不存在" });
        }
        return Ok(new { success = true, data = true, message = (string?)null });
    }
}

public class CreateUserRequest
{
    public UserDTO User { get; set; } = new();
    public string Password { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
