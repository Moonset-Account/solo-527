using Microsoft.EntityFrameworkCore;
using QualityControl.API.Data;
using QualityControl.API.DTOs;
using QualityControl.API.Models;

namespace QualityControl.API.Services;

public interface IQualityInspectionService
{
    Task<PagedResult<QualityInspectionDTO>> GetInspectionsAsync(InspectionQueryDTO query);
    Task<QualityInspectionDTO?> GetInspectionByIdAsync(int id);
    Task<QualityInspectionDTO> CreateInspectionAsync(CreateInspectionDTO dto);
    Task<QualityInspectionDTO?> UpdateInspectionAsync(UpdateInspectionDTO dto);
    Task<bool> CompleteInspectionAsync(int id, int inspectorId);
    Task<InspectionStatisticsDTO> GetStatisticsAsync(int? departmentId = null, int? agentId = null, DateTime? startTime = null, DateTime? endTime = null);
    Task<List<InspectionTemplateDTO>> GetTemplatesAsync();
    Task<InspectionTemplateDTO?> GetTemplateByIdAsync(int id);
}

public class QualityInspectionService : IQualityInspectionService
{
    private readonly AppDbContext _context;

    public QualityInspectionService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<QualityInspectionDTO>> GetInspectionsAsync(InspectionQueryDTO query)
    {
        var queryable = _context.QualityInspections
            .Include(qi => qi.Session)
            .Include(qi => qi.Inspector)
            .Include(qi => qi.InspectionItems)
            .AsQueryable();

        if (query.InspectorId.HasValue)
            queryable = queryable.Where(qi => qi.InspectorId == query.InspectorId.Value);

        if (query.Status.HasValue)
            queryable = queryable.Where(qi => (int)qi.Status == query.Status.Value);

        if (query.StartTime.HasValue)
            queryable = queryable.Where(qi => qi.CreatedAt >= query.StartTime.Value);

        if (query.EndTime.HasValue)
            queryable = queryable.Where(qi => qi.CreatedAt <= query.EndTime.Value);

        if (query.MinScore.HasValue)
            queryable = queryable.Where(qi => qi.TotalScore >= query.MinScore.Value);

        if (query.MaxScore.HasValue)
            queryable = queryable.Where(qi => qi.TotalScore <= query.MaxScore.Value);

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(qi => qi.InspectionNumber.Contains(query.Keyword) ||
                                               (qi.Session != null && qi.Session.Title.Contains(query.Keyword)));

        var totalCount = await queryable.CountAsync();

        queryable = queryable.OrderByDescending(qi => qi.CreatedAt);

        var inspections = await queryable
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var items = inspections.Select(MapToDTO).ToList();

        return new PagedResult<QualityInspectionDTO>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<QualityInspectionDTO?> GetInspectionByIdAsync(int id)
    {
        var inspection = await _context.QualityInspections
            .Include(qi => qi.Session)
            .Include(qi => qi.Inspector)
            .Include(qi => qi.InspectionItems)
            .FirstOrDefaultAsync(qi => qi.Id == id);

        if (inspection == null) return null;

        return MapToDTO(inspection);
    }

    public async Task<QualityInspectionDTO> CreateInspectionAsync(CreateInspectionDTO dto)
    {
        var session = await _context.Sessions.FindAsync(dto.SessionId);
        if (session == null)
            throw new KeyNotFoundException("会话不存在");

        var template = await _context.InspectionTemplates
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == dto.TemplateId);
        if (template == null)
            throw new KeyNotFoundException("质检模板不存在");

        var inspection = new QualityInspection
        {
            InspectionNumber = GenerateInspectionNumber(),
            SessionId = dto.SessionId,
            InspectorId = dto.InspectorId,
            Status = InspectionStatus.Draft,
            TotalScore = 0,
            MaxScore = template.Items.Sum(i => i.MaxScore),
            CreatedAt = DateTime.Now,
            InspectionItems = template.Items.Select(i => new InspectionItem
            {
                ItemName = i.ItemName,
                Description = i.Description,
                Category = i.Category,
                MaxScore = i.MaxScore,
                Score = i.MaxScore,
                IsDeducted = false,
                SortOrder = i.SortOrder
            }).ToList()
        };

        _context.QualityInspections.Add(inspection);
        await _context.SaveChangesAsync();

        session.IsInspected = true;
        session.InspectedAt = DateTime.Now;
        session.InspectorId = dto.InspectorId;
        await _context.SaveChangesAsync();

        return MapToDTO(inspection);
    }

    public async Task<QualityInspectionDTO?> UpdateInspectionAsync(UpdateInspectionDTO dto)
    {
        var inspection = await _context.QualityInspections
            .Include(qi => qi.InspectionItems)
            .FirstOrDefaultAsync(qi => qi.Id == dto.Id);

        if (inspection == null) return null;

        inspection.OverallComment = dto.OverallComment;
        inspection.ImprovementSuggestion = dto.ImprovementSuggestion;
        inspection.IsRequiresRetrain = dto.IsRequiresRetrain;

        foreach (var itemDto in dto.Items)
        {
            var item = inspection.InspectionItems.FirstOrDefault(i => i.Id == itemDto.Id);
            if (item != null)
            {
                item.Score = itemDto.Score;
                item.IsDeducted = itemDto.Score < item.MaxScore;
                item.DeductionReason = itemDto.DeductionReason;
            }
        }

        inspection.TotalScore = inspection.InspectionItems.Sum(i => i.Score);
        inspection.Status = InspectionStatus.InProgress;

        await _context.SaveChangesAsync();

        if (inspection.SessionId > 0)
        {
            var session = await _context.Sessions.FindAsync(inspection.SessionId);
            if (session != null)
            {
                session.InspectionScore = inspection.ScorePercentage;
                await _context.SaveChangesAsync();
            }
        }

        return MapToDTO(inspection);
    }

    public async Task<bool> CompleteInspectionAsync(int id, int inspectorId)
    {
        var inspection = await _context.QualityInspections.FindAsync(id);
        if (inspection == null) return false;

        inspection.Status = InspectionStatus.Completed;
        inspection.CompletedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<InspectionStatisticsDTO> GetStatisticsAsync(int? departmentId = null, int? agentId = null, DateTime? startTime = null, DateTime? endTime = null)
    {
        var queryable = _context.QualityInspections
            .Include(qi => qi.Session)
            .Include(qi => qi.InspectionItems)
            .AsQueryable();

        if (startTime.HasValue)
            queryable = queryable.Where(qi => qi.CreatedAt >= startTime.Value);

        if (endTime.HasValue)
            queryable = queryable.Where(qi => qi.CreatedAt <= endTime.Value);

        if (agentId.HasValue)
        {
            queryable = queryable.Where(qi => qi.Session != null && qi.Session.AgentId == agentId.Value);
        }

        var completedQuery = queryable.Where(qi => qi.Status == InspectionStatus.Completed);

        var stats = new InspectionStatisticsDTO
        {
            TotalInspections = await queryable.CountAsync(),
            CompletedInspections = await completedQuery.CountAsync(),
            PendingInspections = await queryable.Where(qi => qi.Status == InspectionStatus.Draft || qi.Status == InspectionStatus.InProgress).CountAsync(),
            AverageScore = completedQuery.Any() ? await completedQuery.AverageAsync(qi => qi.ScorePercentage) : 0,
            PassRate = completedQuery.Any() ? (double)await completedQuery.CountAsync(qi => qi.ScorePercentage >= 60) / await completedQuery.CountAsync() * 100 : 0,
            RequiresRetrainCount = await completedQuery.CountAsync(qi => qi.IsRequiresRetrain),
        };

        var allItems = await _context.InspectionItems
            .Where(ii => completedQuery.Select(qi => qi.Id).Contains(ii.InspectionId))
            .GroupBy(ii => ii.Category)
            .Select(g => new CategoryScoreDTO
            {
                Category = g.Key,
                AverageScore = g.Average(ii => ii.Score),
                MaxScore = g.Average(ii => ii.MaxScore)
            })
            .ToListAsync();

        stats.CategoryScores = allItems;

        return stats;
    }

    public async Task<List<InspectionTemplateDTO>> GetTemplatesAsync()
    {
        var templates = await _context.InspectionTemplates
            .Include(t => t.Items)
            .Where(t => t.IsActive)
            .OrderBy(t => t.Name)
            .ToListAsync();

        return templates.Select(t => new InspectionTemplateDTO
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            IsActive = t.IsActive,
            Version = t.Version,
            ApplicableDepartment = t.ApplicableDepartment,
            CreatedAt = t.CreatedAt,
            Items = t.Items.OrderBy(i => i.SortOrder).Select(i => new InspectionTemplateItemDTO
            {
                Id = i.Id,
                ItemName = i.ItemName,
                Description = i.Description,
                Category = i.Category,
                MaxScore = i.MaxScore,
                SortOrder = i.SortOrder,
                IsRequired = i.IsRequired
            }).ToList()
        }).ToList();
    }

    public async Task<InspectionTemplateDTO?> GetTemplateByIdAsync(int id)
    {
        var template = await _context.InspectionTemplates
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (template == null) return null;

        return new InspectionTemplateDTO
        {
            Id = template.Id,
            Name = template.Name,
            Description = template.Description,
            IsActive = template.IsActive,
            Version = template.Version,
            ApplicableDepartment = template.ApplicableDepartment,
            CreatedAt = template.CreatedAt,
            Items = template.Items.OrderBy(i => i.SortOrder).Select(i => new InspectionTemplateItemDTO
            {
                Id = i.Id,
                ItemName = i.ItemName,
                Description = i.Description,
                Category = i.Category,
                MaxScore = i.MaxScore,
                SortOrder = i.SortOrder,
                IsRequired = i.IsRequired
            }).ToList()
        };
    }

    private static string GenerateInspectionNumber()
    {
        return $"QI{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
    }

    private static string GetStatusText(InspectionStatus status)
    {
        return status switch
        {
            InspectionStatus.Draft => "草稿",
            InspectionStatus.InProgress => "进行中",
            InspectionStatus.Completed => "已完成",
            InspectionStatus.Appeal => "申诉中",
            InspectionStatus.Appealed => "已申诉",
            _ => "未知"
        };
    }

    private static QualityInspectionDTO MapToDTO(QualityInspection inspection)
    {
        return new QualityInspectionDTO
        {
            Id = inspection.Id,
            InspectionNumber = inspection.InspectionNumber,
            SessionId = inspection.SessionId,
            SessionNumber = inspection.Session?.SessionNumber,
            SessionTitle = inspection.Session?.Title,
            InspectorId = inspection.InspectorId,
            InspectorName = inspection.Inspector?.FullName,
            Status = (int)inspection.Status,
            StatusText = GetStatusText(inspection.Status),
            OverallComment = inspection.OverallComment,
            TotalScore = inspection.TotalScore,
            MaxScore = inspection.MaxScore,
            ScorePercentage = inspection.ScorePercentage,
            ImprovementSuggestion = inspection.ImprovementSuggestion,
            IsRequiresRetrain = inspection.IsRequiresRetrain,
            CreatedAt = inspection.CreatedAt,
            CompletedAt = inspection.CompletedAt,
            RelatedTicketId = inspection.RelatedTicketId,
            InspectionItems = inspection.InspectionItems.OrderBy(i => i.SortOrder).Select(ii => new InspectionItemDTO
            {
                Id = ii.Id,
                InspectionId = ii.InspectionId,
                ItemName = ii.ItemName,
                Description = ii.Description,
                Category = ii.Category,
                MaxScore = ii.MaxScore,
                Score = ii.Score,
                IsDeducted = ii.IsDeducted,
                DeductionReason = ii.DeductionReason,
                SortOrder = ii.SortOrder
            }).ToList()
        };
    }
}
