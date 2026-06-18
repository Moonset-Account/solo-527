using System.Security.Claims;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArtEduScheduler.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;

    public ClassesController(IClassService classService)
    {
        _classService = classService;
    }

    private int GetOperatorId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");

    [HttpGet]
    public async Task<ActionResult<List<ClassDto>>> GetClasses(
        [FromQuery] int? teacherId = null,
        [FromQuery] bool activeOnly = true)
    {
        var classes = await _classService.GetClassesAsync(teacherId, activeOnly);
        return Ok(classes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClassDto>> GetClass(int id)
    {
        var cls = await _classService.GetClassByIdAsync(id);
        if (cls == null) return NotFound();
        return Ok(cls);
    }

    [HttpGet("my")]
    [Authorize(Roles = "Student")]
    public async Task<ActionResult<List<ClassDto>>> GetMyClasses()
    {
        var studentId = GetOperatorId();
        var classes = await _classService.GetStudentClassesAsync(studentId);
        return Ok(classes);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<ClassDto>> CreateClass([FromBody] CreateClassDto dto)
    {
        try
        {
            var cls = await _classService.CreateClassAsync(dto, GetOperatorId());
            return CreatedAtAction(nameof(GetClass), new { id = cls.Id }, cls);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<ActionResult<ClassDto>> UpdateClass(int id, [FromBody] CreateClassDto dto)
    {
        try
        {
            var cls = await _classService.UpdateClassAsync(id, dto, GetOperatorId());
            return Ok(cls);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{classId}/students/{studentId}")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<IActionResult> EnrollStudent(int classId, int studentId)
    {
        try
        {
            await _classService.EnrollStudentAsync(classId, studentId, GetOperatorId());
            return Ok(new { message = "学生已加入班级" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{classId}/students/{studentId}")]
    [Authorize(Roles = "Admin,Principal")]
    public async Task<IActionResult> RemoveStudent(int classId, int studentId)
    {
        try
        {
            await _classService.RemoveStudentAsync(classId, studentId, GetOperatorId());
            return Ok(new { message = "学生已从班级移除" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
