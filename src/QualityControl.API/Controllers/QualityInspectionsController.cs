using Microsoft.AspNetCore.Mvc;
using QualityControl.API.DTOs;
using QualityControl.API.Services;

namespace QualityControl.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QualityInspectionsController : ControllerBase
{
    private readonly IQualityInspectionService _inspectionService;

    public QualityInspectionsController(IQualityInspectionService inspectionService)
    {
        _inspectionService = inspectionService;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<QualityInspectionDTO>>> GetInspections([FromQuery] InspectionQueryDTO query)
    {
        var result = await _inspectionService.GetInspectionsAsync(query);
        return ApiResponse<PagedResult<QualityInspectionDTO>>.Ok(result, "获取质检记录成功");
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<QualityInspectionDTO>> GetInspection(int id)
    {
        var inspection = await _inspectionService.GetInspectionByIdAsync(id);
        if (inspection == null)
        {
            return ApiResponse<QualityInspectionDTO>.Fail("质检记录不存在", 404, new ErrorDetails
            {
                ErrorCode = "INSPECTION_NOT_FOUND",
                ErrorMessage = "质检记录不存在或已被删除",
                NextStep = "请检查质检记录ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "请求的质检记录ID在系统中不存在。",
                SupportUrl = "/help/inspections"
            });
        }
        return ApiResponse<QualityInspectionDTO>.Ok(inspection!, "获取质检详情成功");
    }

    [HttpPost]
    public async Task<ApiResponse<QualityInspectionDTO>> CreateInspection([FromBody] CreateInspectionDTO dto)
    {
        if (dto.SessionId <= 0 || dto.InspectorId <= 0 || dto.TemplateId <= 0)
        {
            return ApiResponse<QualityInspectionDTO>.Fail("缺少必要参数", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "创建质检记录缺少必要参数",
                NextStep = "请确保选择了会话、质检员和质检模板后重试。",
                DetailedDescription = "创建质检记录需要提供会话ID、质检员ID和模板ID。"
            });
        }

        try
        {
            var inspection = await _inspectionService.CreateInspectionAsync(dto);
            return ApiResponse<QualityInspectionDTO>.Ok(inspection, "质检记录创建成功");
        }
        catch (KeyNotFoundException ex)
        {
            return ApiResponse<QualityInspectionDTO>.Fail(ex.Message, 404, new ErrorDetails
            {
                ErrorCode = "RELATED_RESOURCE_NOT_FOUND",
                ErrorMessage = ex.Message,
                NextStep = "请检查相关资源是否存在，选择有效的会话和质检模板。",
                DetailedDescription = "创建质检时关联的资源不存在。"
            });
        }
    }

    [HttpPut]
    public async Task<ApiResponse<QualityInspectionDTO>> UpdateInspection([FromBody] UpdateInspectionDTO dto)
    {
        if (dto.Id <= 0)
        {
            return ApiResponse<QualityInspectionDTO>.Fail("质检记录ID不能为空", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "质检记录ID不能为空",
                NextStep = "请确保提供了有效的质检记录ID。",
                DetailedDescription = "更新质检记录需要提供正确的记录ID。"
            });
        }

        var inspection = await _inspectionService.UpdateInspectionAsync(dto);
        if (inspection == null)
        {
            return ApiResponse<QualityInspectionDTO>.Fail("质检记录不存在", 404, new ErrorDetails
            {
                ErrorCode = "INSPECTION_NOT_FOUND",
                ErrorMessage = "质检记录不存在，无法更新",
                NextStep = "请检查质检记录ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "更新的质检记录在系统中不存在。"
            });
        }
        return ApiResponse<QualityInspectionDTO>.Ok(inspection!, "质检记录更新成功");
    }

    [HttpPost("{id}/complete")]
    public async Task<ApiResponse<bool>> CompleteInspection(int id, [FromBody] int inspectorId)
    {
        var result = await _inspectionService.CompleteInspectionAsync(id, inspectorId);
        if (!result)
        {
            return ApiResponse<bool>.Fail("质检记录不存在", 404, new ErrorDetails
            {
                ErrorCode = "INSPECTION_NOT_FOUND",
                ErrorMessage = "质检记录不存在，无法完成",
                NextStep = "请检查质检记录ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "要完成的质检记录在系统中不存在。"
            });
        }
        return ApiResponse<bool>.Ok(true, "质检完成成功");
    }

    [HttpGet("statistics")]
    public async Task<ApiResponse<InspectionStatisticsDTO>> GetStatistics(
        [FromQuery] int? departmentId,
        [FromQuery] int? agentId,
        [FromQuery] DateTime? startTime,
        [FromQuery] DateTime? endTime)
    {
        var stats = await _inspectionService.GetStatisticsAsync(departmentId, agentId, startTime, endTime);
        return ApiResponse<InspectionStatisticsDTO>.Ok(stats, "获取质检统计成功");
    }

    [HttpGet("templates")]
    public async Task<ApiResponse<List<InspectionTemplateDTO>>> GetTemplates()
    {
        var templates = await _inspectionService.GetTemplatesAsync();
        return ApiResponse<List<InspectionTemplateDTO>>.Ok(templates, "获取质检模板成功");
    }

    [HttpGet("templates/{id}")]
    public async Task<ApiResponse<InspectionTemplateDTO>> GetTemplate(int id)
    {
        var template = await _inspectionService.GetTemplateByIdAsync(id);
        if (template == null)
        {
            return ApiResponse<InspectionTemplateDTO>.Fail("质检模板不存在", 404, new ErrorDetails
            {
                ErrorCode = "TEMPLATE_NOT_FOUND",
                ErrorMessage = "质检模板不存在或已被禁用",
                NextStep = "请选择一个有效的质检模板，或联系管理员创建新模板。",
                DetailedDescription = "请求的质检模板ID在系统中不存在。"
            });
        }
        return ApiResponse<InspectionTemplateDTO>.Ok(template!, "获取模板详情成功");
    }
}
