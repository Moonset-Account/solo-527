
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DoctorsController : ControllerBase
{
    private readonly IDoctorService _doctorService;

    public DoctorsController(IDoctorService doctorService)
    {
        _doctorService = doctorService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResultDto<PagedResultDto<DoctorDto>>>> GetList([FromQuery] DoctorQueryDto query)
    {
        var result = await _doctorService.GetListAsync(query);
        return Ok(new ApiResultDto<PagedResultDto<DoctorDto>>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("all")]
    public async Task<ActionResult<ApiResultDto<List<DoctorDto>>>> GetAll([FromQuery] int? clinicId = null)
    {
        var result = await _doctorService.GetAllAsync(clinicId);
        return Ok(new ApiResultDto<List<DoctorDto>>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResultDto<DoctorDto>>> GetById(int id)
    {
        var doctor = await _doctorService.GetByIdAsync(id);
        if (doctor == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "医生不存在" });

        return Ok(new ApiResultDto<DoctorDto>
        {
            Success = true,
            Code = 200,
            Data = doctor
        });
    }

    [HttpPost]
    public async Task<ActionResult<ApiResultDto<DoctorDto>>> Create(DoctorCreateDto dto)
    {
        var result = await _doctorService.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, new ApiResultDto<DoctorDto>
        {
            Success = true,
            Code = 201,
            Data = result
        });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResultDto<DoctorDto>>> Update(int id, DoctorUpdateDto dto)
    {
        var result = await _doctorService.UpdateAsync(id, dto);
        if (result == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "医生不存在" });

        return Ok(new ApiResultDto<DoctorDto>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResultDto>> Delete(int id)
    {
        var result = await _doctorService.DeleteAsync(id);
        if (!result)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "医生不存在" });

        return Ok(new ApiResultDto { Success = true, Code = 200, Message = "删除成功" });
    }
}
