
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
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;List&lt;WorkloadReportDto&gt;&gt;&gt;&gt; GetList([FromQuery] WorkloadReportQueryDto query)
    {
        var result = await _workloadReportService.GetListAsync(query);
        return Ok(new ApiResultDto&lt;List&lt;WorkloadReportDto&gt;&gt;
        {
            Success = true,
            Code = 200,
            Data = result
        });
    }

    [HttpGet("{id}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;WorkloadReportDto&gt;&gt;&gt; GetById(int id)
    {
        var report = await _workloadReportService.GetByIdAsync(id);
        if (report == null)
            return NotFound(new ApiResultDto { Success = false, Code = 404, Message = "报表不存在" });

        return Ok(new ApiResultDto&lt;WorkloadReportDto&gt;
        {
            Success = true,
            Code = 200,
            Data = report
        });
    }

    [HttpPost("generate/{doctorId}")]
    public async Task&lt;ActionResult&lt;ApiResultDto&lt;WorkloadReportDto&gt;&gt;&gt; Generate(int doctorId, [FromQuery] DateTime reportDate)
    {
        var result = await _workloadReportService.GenerateAsync(doctorId, reportDate);
        return Ok(new ApiResultDto&lt;WorkloadReportDto&gt;
        {
            Success = true,
            Code = 200,
            Data = result,
            Message = "生成成功"
        });
    }

    [HttpPost("generate-daily")]
    public async Task&lt;ActionResult&lt;ApiResultDto&gt;&gt; GenerateDaily([FromQuery] DateTime reportDate)
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
