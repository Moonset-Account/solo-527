
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DentalClinic.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WorkloadReportsController : ControllerBase
{
    private readonly IWorkloadReportService _workloadReportService;

    public WorkloadReportsController(IWorkloadReportService workloadReportService)
    {
        _workloadReportService = workloadReportService;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResultDto<List<WorkloadReportDto>>>> GetList([FromQuery] WorkloadReportQueryDto query)
    {
        var result = await _workloadReportService.GetListAsync(query);
        return Ok(new ApiResultDto<List<WorkloadReportDto>>
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResultDto<WorkloadReportDto>>> GetById(int id)
    {
        var report = await _workloadReportService.GetByIdAsync(id);
        if (report == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "报表不存在" });

        return Ok(new ApiResultDto<WorkloadReportDto>
        {
            Success = true,
            Code = 200,
            Data = report
        });
    }

    [HttpPost("generate/{doctorId}")]
    public async Task<ActionResult<ApiResultDto<WorkloadReportDto>>> Generate(int doctorId, [FromQuery] DateTime reportDate)
    {
        var result = await _workloadReportService.GenerateAsync(doctorId, reportDate);
        return Ok(new ApiResultDto<WorkloadReportDto>
        {
            Success = true,
            Code = 200,
            Data = result,
            Message = "生成成功"
        });
    }

    [HttpPost("generate-daily")]
    public async Task<ActionResult<ApiResultDto>> GenerateDaily([FromQuery] DateTime reportDate)
    {
        await _workloadReportService.GenerateDailyReportsAsync(reportDate);
        return Ok(new ApiResultDto
        {
            Success = true,
            Code = 200,
            Message = "日排班负荷报表生成完成"
        });
    }
}
