using Microsoft.AspNetCore.Mvc;
using QualityControl.API.DTOs;
using QualityControl.API.Services;

namespace QualityControl.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class KnowledgeBaseController : ControllerBase
{
    private readonly IKnowledgeBaseService _knowledgeService;

    public KnowledgeBaseController(IKnowledgeBaseService knowledgeService)
    {
        _knowledgeService = knowledgeService;
    }

    [HttpGet]
    public async Task<ApiResponse<PagedResult<KnowledgeBaseDTO>>> GetKnowledgeBases([FromQuery] KnowledgeBaseQueryDTO query)
    {
        var result = await _knowledgeService.GetKnowledgeBasesAsync(query);
        return ApiResponse<PagedResult<KnowledgeBaseDTO>>.Ok(result, "获取知识库列表成功");
    }

    [HttpGet("{id}")]
    public async Task<ApiResponse<KnowledgeBaseDTO>> GetKnowledgeBase(int id)
    {
        var knowledge = await _knowledgeService.GetKnowledgeBaseByIdAsync(id);
        if (knowledge == null)
        {
            return ApiResponse<KnowledgeBaseDTO>.Fail("知识库条目不存在", 404, new ErrorDetails
            {
                ErrorCode = "KNOWLEDGE_NOT_FOUND",
                ErrorMessage = "知识库条目不存在或已被删除",
                NextStep = "请检查知识库ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "请求的知识库条目ID在系统中不存在。",
                SupportUrl = "/help/knowledge"
            });
        }
        return ApiResponse<KnowledgeBaseDTO>.Ok(knowledge!, "获取知识库详情成功");
    }

    [HttpPost]
    public async Task<ApiResponse<KnowledgeBaseDTO>> CreateKnowledgeBase([FromBody] CreateKnowledgeBaseDTO dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Content))
        {
            return ApiResponse<KnowledgeBaseDTO>.Fail("缺少必要参数", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "创建知识库条目缺少必要参数",
                NextStep = "请确保填写了标题和内容后重试。",
                DetailedDescription = "创建知识库条目需要提供标题和内容。"
            });
        }

        var knowledge = await _knowledgeService.CreateKnowledgeBaseAsync(dto);
        return ApiResponse<KnowledgeBaseDTO>.Ok(knowledge, "知识库条目创建成功");
    }

    [HttpPut]
    public async Task<ApiResponse<KnowledgeBaseDTO>> UpdateKnowledgeBase([FromBody] UpdateKnowledgeBaseDTO dto)
    {
        if (dto.Id <= 0)
        {
            return ApiResponse<KnowledgeBaseDTO>.Fail("知识库ID不能为空", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "知识库条目ID不能为空",
                NextStep = "请确保提供了有效的知识库条目ID。",
                DetailedDescription = "更新知识库条目需要提供正确的记录ID。"
            });
        }

        var knowledge = await _knowledgeService.UpdateKnowledgeBaseAsync(dto);
        if (knowledge == null)
        {
            return ApiResponse<KnowledgeBaseDTO>.Fail("知识库条目不存在", 404, new ErrorDetails
            {
                ErrorCode = "KNOWLEDGE_NOT_FOUND",
                ErrorMessage = "知识库条目不存在，无法更新",
                NextStep = "请检查知识库ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "要更新的知识库条目在系统中不存在。"
            });
        }
        return ApiResponse<KnowledgeBaseDTO>.Ok(knowledge!, "知识库条目更新成功");
    }

    [HttpDelete("{id}")]
    public async Task<ApiResponse<bool>> DeleteKnowledgeBase(int id)
    {
        var result = await _knowledgeService.DeleteKnowledgeBaseAsync(id);
        if (!result)
        {
            return ApiResponse<bool>.Fail("知识库条目不存在", 404, new ErrorDetails
            {
                ErrorCode = "KNOWLEDGE_NOT_FOUND",
                ErrorMessage = "知识库条目不存在，无法删除",
                NextStep = "请检查知识库ID是否正确，或返回列表页重新选择。",
                DetailedDescription = "要删除的知识库条目在系统中不存在。"
            });
        }
        return ApiResponse<bool>.Ok(true, "知识库条目已归档");
    }

    [HttpPost("review")]
    public async Task<ApiResponse<KnowledgeReviewRecordDTO>> AddReview([FromBody] AddKnowledgeReviewDTO dto)
    {
        if (dto.KnowledgeBaseId <= 0 || dto.ReviewerId <= 0)
        {
            return ApiResponse<KnowledgeReviewRecordDTO>.Fail("缺少必要参数", 400, new ErrorDetails
            {
                ErrorCode = "INVALID_PARAMS",
                ErrorMessage = "添加审核记录缺少必要参数",
                NextStep = "请确保提供了知识库ID和审核人ID后重试。",
                DetailedDescription = "添加审核记录需要提供知识库ID和审核人ID。"
            });
        }

        var review = await _knowledgeService.AddReviewAsync(dto);
        return ApiResponse<KnowledgeReviewRecordDTO>.Ok(review, "审核记录添加成功");
    }

    [HttpGet("{knowledgeBaseId}/reviews")]
    public async Task<ApiResponse<List<KnowledgeReviewRecordDTO>>> GetReviews(int knowledgeBaseId)
    {
        var reviews = await _knowledgeService.GetReviewRecordsAsync(knowledgeBaseId);
        return ApiResponse<List<KnowledgeReviewRecordDTO>>.Ok(reviews, "获取审核记录成功");
    }

    [HttpGet("statistics")]
    public async Task<ApiResponse<KnowledgeStatisticsDTO>> GetStatistics()
    {
        var stats = await _knowledgeService.GetStatisticsAsync();
        return ApiResponse<KnowledgeStatisticsDTO>.Ok(stats, "获取知识库统计成功");
    }

    [HttpGet("expiring-soon")]
    public async Task<ApiResponse<List<KnowledgeBaseDTO>>> GetExpiringSoon([FromQuery] int daysAhead = 7)
    {
        var knowledgeList = await _knowledgeService.GetExpiredKnowledgeAsync(daysAhead);
        return ApiResponse<List<KnowledgeBaseDTO>>.Ok(knowledgeList, "获取即将失效知识成功");
    }

    [HttpPost("{id}/use")]
    public async Task<ApiResponse<bool>> MarkAsUsed(int id, [FromBody] bool isHelpful)
    {
        var result = await _knowledgeService.MarkAsUsedAsync(id, isHelpful);
        if (!result)
        {
            return ApiResponse<bool>.Fail("知识库条目不存在", 404, new ErrorDetails
            {
                ErrorCode = "KNOWLEDGE_NOT_FOUND",
                ErrorMessage = "知识库条目不存在",
                NextStep = "请检查知识库ID是否正确。",
                DetailedDescription = "标记使用的知识库条目在系统中不存在。"
            });
        }
        return ApiResponse<bool>.Ok(true, "使用记录已更新");
    }
}
