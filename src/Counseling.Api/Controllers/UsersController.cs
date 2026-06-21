using Counseling.Application.DTOs;
using Counseling.Application.Interfaces;
using Counseling.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Counseling.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetAll()
    {
        var result = await _userService.GetAllAsync();
        return Ok(new ApiResponse<List<UserDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetById(int id)
    {
        var result = await _userService.GetByIdAsync(id);
        if (result == null)
        {
            return NotFound(new ApiResponse<UserDto>
            {
                Success = false,
                Message = $"找不到ID为 {id} 的用户，请检查用户ID是否正确",
                Code = 404
            });
        }
        return Ok(new ApiResponse<UserDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("username/{username}")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetByUsername(string username)
    {
        var result = await _userService.GetByUsernameAsync(username);
        if (result == null)
        {
            return NotFound(new ApiResponse<UserDto>
            {
                Success = false,
                Message = $"找不到用户名为 '{username}' 的用户",
                Code = 404
            });
        }
        return Ok(new ApiResponse<UserDto>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpGet("role/{role}")]
    public async Task<ActionResult<ApiResponse<List<UserDto>>>> GetByRole(UserRole role)
    {
        var result = await _userService.GetByRoleAsync(role);
        return Ok(new ApiResponse<List<UserDto>>
        {
            Success = true,
            Message = "获取成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<UserDto>>> Create([FromBody] UserCreateDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Username))
            return BadRequest(new ApiResponse<UserDto>
            {
                Success = false,
                Message = "用户名不能为空，请设置登录用户名",
                Code = 400
            });

        if (string.IsNullOrWhiteSpace(dto.Password))
            return BadRequest(new ApiResponse<UserDto>
            {
                Success = false,
                Message = "密码不能为空，请设置安全的登录密码",
                Code = 400
            });

        if (dto.Password.Length < 6)
            return BadRequest(new ApiResponse<UserDto>
            {
                Success = false,
                Message = "密码长度不能少于6位，请设置更安全的密码",
                Code = 400
            });

        if (string.IsNullOrWhiteSpace(dto.FullName))
            return BadRequest(new ApiResponse<UserDto>
            {
                Success = false,
                Message = "姓名不能为空，请填写真实姓名",
                Code = 400
            });

        if (string.IsNullOrWhiteSpace(dto.Phone))
            return BadRequest(new ApiResponse<UserDto>
            {
                Success = false,
                Message = "手机号不能为空，请填写有效手机号",
                Code = 400
            });

        var result = await _userService.CreateAsync(dto, "system");
        return Ok(new ApiResponse<UserDto>
        {
            Success = true,
            Message = "用户创建成功",
            Code = 200,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse>> Update(int id, [FromBody] UserUpdateDto dto)
    {
        await _userService.UpdateAsync(id, dto, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "用户信息已更新成功",
            Code = 200
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(int id)
    {
        await _userService.DeleteAsync(id, "system");
        return Ok(new ApiResponse
        {
            Success = true,
            Message = "用户已删除成功",
            Code = 200
        });
    }

    [HttpPost("validate-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ValidatePassword([FromBody] LoginRequest request)
    {
        var valid = await _userService.ValidatePasswordAsync(request.Username, request.Password);
        return Ok(new ApiResponse<bool>
        {
            Success = valid,
            Message = valid ? "登录验证成功" : "用户名或密码错误，请重新输入",
            Code = valid ? 200 : 401,
            Data = valid
        });
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
