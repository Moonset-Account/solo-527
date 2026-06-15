using Microsoft.EntityFrameworkCore;
using QualityControl.API.Data;
using QualityControl.API.DTOs;
using QualityControl.API.Models;

namespace QualityControl.API.Services;

public interface IKnowledgeBaseService
{
    Task<PagedResult<KnowledgeBaseDTO>> GetKnowledgeBasesAsync(KnowledgeBaseQueryDTO query);
    Task<KnowledgeBaseDTO?> GetKnowledgeBaseByIdAsync(int id);
    Task<KnowledgeBaseDTO> CreateKnowledgeBaseAsync(CreateKnowledgeBaseDTO dto);
    Task<KnowledgeBaseDTO?> UpdateKnowledgeBaseAsync(UpdateKnowledgeBaseDTO dto);
    Task<bool> DeleteKnowledgeBaseAsync(int id);
    Task<KnowledgeReviewRecordDTO> AddReviewAsync(AddKnowledgeReviewDTO dto);
    Task<List<KnowledgeReviewRecordDTO>> GetReviewRecordsAsync(int knowledgeBaseId);
    Task<KnowledgeStatisticsDTO> GetStatisticsAsync();
    Task<List<KnowledgeBaseDTO>> GetExpiredKnowledgeAsync(int daysAhead = 7);
    Task<bool> MarkAsUsedAsync(int id, bool isHelpful);
}

public class KnowledgeBaseService : IKnowledgeBaseService
{
    private readonly AppDbContext _context;

    public KnowledgeBaseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<KnowledgeBaseDTO>> GetKnowledgeBasesAsync(KnowledgeBaseQueryDTO query)
    {
        var queryable = _context.KnowledgeBases
            .Include(kb => kb.Author)
            .Include(kb => kb.Reviewer)
            .AsQueryable();

        if (!string.IsNullOrEmpty(query.Category))
            queryable = queryable.Where(kb => kb.Category == query.Category);

        if (query.Status.HasValue)
            queryable = queryable.Where(kb => (int)kb.Status == query.Status.Value);

        if (query.IsExpired.HasValue)
            queryable = queryable.Where(kb => kb.IsExpired == query.IsExpired.Value);

        if (query.NeedReview == true)
        {
            var thirtyDaysAgo = DateTime.Now.AddDays(-30);
            queryable = queryable.Where(kb => kb.LastReviewAt < thirtyDaysAgo || kb.LastReviewAt == null);
        }

        if (query.AuthorId.HasValue)
            queryable = queryable.Where(kb => kb.AuthorId == query.AuthorId.Value);

        if (query.StartTime.HasValue)
            queryable = queryable.Where(kb => kb.CreatedAt >= query.StartTime.Value);

        if (query.EndTime.HasValue)
            queryable = queryable.Where(kb => kb.CreatedAt <= query.EndTime.Value);

        if (!string.IsNullOrEmpty(query.Keyword))
            queryable = queryable.Where(kb => kb.Title.Contains(query.Keyword) || kb.Content.Contains(query.Keyword));

        var totalCount = await queryable.CountAsync();

        queryable = queryable.OrderByDescending(kb => kb.CreatedAt);

        var knowledgeBases = await queryable
            .Skip((query.PageIndex - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync();

        var items = knowledgeBases.Select(MapToDTO).ToList();

        return new PagedResult<KnowledgeBaseDTO>
        {
            Items = items,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<KnowledgeBaseDTO?> GetKnowledgeBaseByIdAsync(int id)
    {
        var knowledgeBase = await _context.KnowledgeBases
            .Include(kb => kb.Author)
            .Include(kb => kb.Reviewer)
            .Include(kb => kb.ReviewRecords)
            .FirstOrDefaultAsync(kb => kb.Id == id);

        if (knowledgeBase == null) return null;

        knowledgeBase.ViewCount++;
        await _context.SaveChangesAsync();

        return MapToDTO(knowledgeBase);
    }

    public async Task<KnowledgeBaseDTO> CreateKnowledgeBaseAsync(CreateKnowledgeBaseDTO dto)
    {
        var knowledgeBase = new KnowledgeBase
        {
            Title = dto.Title,
            Content = dto.Content,
            Summary = dto.Summary,
            Category = dto.Category,
            Status = KnowledgeStatus.Draft,
            IsExpired = dto.ExpiryDate.HasValue && dto.ExpiryDate.Value < DateTime.Now,
            ExpiryDate = dto.ExpiryDate,
            AuthorId = dto.AuthorId,
            Tags = dto.Tags,
            Remark = dto.Remark,
            ViewCount = 0,
            UseCount = 0,
            HelpfulCount = 0,
            NotHelpfulCount = 0,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        _context.KnowledgeBases.Add(knowledgeBase);
        await _context.SaveChangesAsync();

        return MapToDTO(knowledgeBase);
    }

    public async Task<KnowledgeBaseDTO?> UpdateKnowledgeBaseAsync(UpdateKnowledgeBaseDTO dto)
    {
        var knowledgeBase = await _context.KnowledgeBases.FindAsync(dto.Id);
        if (knowledgeBase == null) return null;

        knowledgeBase.Title = dto.Title;
        knowledgeBase.Content = dto.Content;
        knowledgeBase.Summary = dto.Summary;
        knowledgeBase.Category = dto.Category;
        knowledgeBase.Status = (KnowledgeStatus)dto.Status;
        knowledgeBase.ExpiryDate = dto.ExpiryDate;
        knowledgeBase.IsExpired = dto.ExpiryDate.HasValue && dto.ExpiryDate.Value < DateTime.Now;
        knowledgeBase.Remark = dto.Remark;
        knowledgeBase.ProcessingResult = dto.ProcessingResult;
        knowledgeBase.Tags = dto.Tags;
        knowledgeBase.ReviewerId = dto.ReviewerId;
        knowledgeBase.UpdatedAt = DateTime.Now;

        if (dto.Status == (int)KnowledgeStatus.Published)
        {
            knowledgeBase.LastReviewAt = DateTime.Now;
        }

        await _context.SaveChangesAsync();

        return MapToDTO(knowledgeBase);
    }

    public async Task<bool> DeleteKnowledgeBaseAsync(int id)
    {
        var knowledgeBase = await _context.KnowledgeBases.FindAsync(id);
        if (knowledgeBase == null) return false;

        knowledgeBase.Status = KnowledgeStatus.Archived;
        knowledgeBase.UpdatedAt = DateTime.Now;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<KnowledgeReviewRecordDTO> AddReviewAsync(AddKnowledgeReviewDTO dto)
    {
        var review = new KnowledgeReviewRecord
        {
            KnowledgeBaseId = dto.KnowledgeBaseId,
            ReviewerId = dto.ReviewerId,
            ReviewerName = dto.ReviewerName,
            Result = (ReviewResult)dto.Result,
            Comment = dto.Comment,
            ProcessingResult = dto.ProcessingResult,
            CustomerSatisfaction = dto.CustomerSatisfaction,
            ReviewedAt = DateTime.Now
        };

        _context.KnowledgeReviewRecords.Add(review);

        var knowledgeBase = await _context.KnowledgeBases.FindAsync(dto.KnowledgeBaseId);
        if (knowledgeBase != null)
        {
            knowledgeBase.LastReviewAt = DateTime.Now;
            knowledgeBase.ReviewerId = dto.ReviewerId;
            knowledgeBase.ProcessingResult = dto.ProcessingResult;

            if (dto.Result == (int)ReviewResult.Approved)
            {
                knowledgeBase.Status = KnowledgeStatus.Published;
            }
            else if (dto.Result == (int)ReviewResult.NeedsRevision)
            {
                knowledgeBase.Status = KnowledgeStatus.NeedsUpdate;
            }
            else if (dto.Result == (int)ReviewResult.Rejected)
            {
                knowledgeBase.Status = KnowledgeStatus.Draft;
            }
            else if (dto.Result == (int)ReviewResult.Expired)
            {
                knowledgeBase.Status = KnowledgeStatus.Expired;
                knowledgeBase.IsExpired = true;
            }
        }

        await _context.SaveChangesAsync();

        return new KnowledgeReviewRecordDTO
        {
            Id = review.Id,
            KnowledgeBaseId = review.KnowledgeBaseId,
            ReviewerId = review.ReviewerId,
            ReviewerName = review.ReviewerName,
            Result = (int)review.Result,
            ResultText = GetResultText(review.Result),
            Comment = review.Comment,
            ProcessingResult = review.ProcessingResult,
            CustomerSatisfaction = review.CustomerSatisfaction,
            ReviewedAt = review.ReviewedAt
        };
    }

    public async Task<List<KnowledgeReviewRecordDTO>> GetReviewRecordsAsync(int knowledgeBaseId)
    {
        var records = await _context.KnowledgeReviewRecords
            .Where(r => r.KnowledgeBaseId == knowledgeBaseId)
            .OrderByDescending(r => r.ReviewedAt)
            .ToListAsync();

        return records.Select(r => new KnowledgeReviewRecordDTO
        {
            Id = r.Id,
            KnowledgeBaseId = r.KnowledgeBaseId,
            ReviewerId = r.ReviewerId,
            ReviewerName = r.ReviewerName,
            Result = (int)r.Result,
            ResultText = GetResultText(r.Result),
            Comment = r.Comment,
            ProcessingResult = r.ProcessingResult,
            CustomerSatisfaction = r.CustomerSatisfaction,
            ReviewedAt = r.ReviewedAt
        }).ToList();
    }

    public async Task<KnowledgeStatisticsDTO> GetStatisticsAsync()
    {
        var stats = new KnowledgeStatisticsDTO
        {
            TotalKnowledge = await _context.KnowledgeBases.CountAsync(),
            PublishedKnowledge = await _context.KnowledgeBases.Where(kb => kb.Status == KnowledgeStatus.Published).CountAsync(),
            ExpiredKnowledge = await _context.KnowledgeBases.Where(kb => kb.IsExpired || kb.Status == KnowledgeStatus.Expired).CountAsync(),
            NeedReviewKnowledge = await _context.KnowledgeBases.CountAsync(kb => kb.LastReviewAt == null || kb.LastReviewAt < DateTime.Now.AddDays(-30)),
            TotalViews = await _context.KnowledgeBases.SumAsync(kb => kb.ViewCount),
            TotalUses = await _context.KnowledgeBases.SumAsync(kb => kb.UseCount),
            HelpfulRate = 0
        };

        var totalFeedback = await _context.KnowledgeBases.SumAsync(kb => kb.HelpfulCount + kb.NotHelpfulCount);
        if (totalFeedback > 0)
        {
            stats.HelpfulRate = (double)await _context.KnowledgeBases.SumAsync(kb => kb.HelpfulCount) / totalFeedback * 100;
        }

        var categoryCounts = await _context.KnowledgeBases
            .GroupBy(kb => kb.Category)
            .Select(g => new CategoryKnowledgeCountDTO
            {
                Category = g.Key,
                Count = g.Count()
            })
            .ToListAsync();

        stats.CategoryCounts = categoryCounts;

        return stats;
    }

    public async Task<List<KnowledgeBaseDTO>> GetExpiredKnowledgeAsync(int daysAhead = 7)
    {
        var targetDate = DateTime.Now.AddDays(daysAhead);
        var knowledgeBases = await _context.KnowledgeBases
            .Include(kb => kb.Author)
            .Where(kb => kb.Status == KnowledgeStatus.Published && kb.ExpiryDate.HasValue && kb.ExpiryDate.Value <= targetDate)
            .OrderBy(kb => kb.ExpiryDate)
            .Take(20)
            .ToListAsync();

        return knowledgeBases.Select(MapToDTO).ToList();
    }

    public async Task<bool> MarkAsUsedAsync(int id, bool isHelpful)
    {
        var knowledgeBase = await _context.KnowledgeBases.FindAsync(id);
        if (knowledgeBase == null) return false;

        knowledgeBase.UseCount++;
        knowledgeBase.LastUsedAt = DateTime.Now;

        if (isHelpful)
        {
            knowledgeBase.HelpfulCount++;
        }
        else
        {
            knowledgeBase.NotHelpfulCount++;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static string GetStatusText(KnowledgeStatus status)
    {
        return status switch
        {
            KnowledgeStatus.Draft => "草稿",
            KnowledgeStatus.UnderReview => "审核中",
            KnowledgeStatus.Published => "已发布",
            KnowledgeStatus.NeedsUpdate => "待更新",
            KnowledgeStatus.Archived => "已归档",
            KnowledgeStatus.Expired => "已失效",
            _ => "未知"
        };
    }

    private static string GetResultText(ReviewResult result)
    {
        return result switch
        {
            ReviewResult.Approved => "通过",
            ReviewResult.NeedsRevision => "需修订",
            ReviewResult.Rejected => "拒绝",
            ReviewResult.Expired => "失效",
            _ => "未知"
        };
    }

    private static KnowledgeBaseDTO MapToDTO(KnowledgeBase kb)
    {
        var dto = new KnowledgeBaseDTO
        {
            Id = kb.Id,
            Title = kb.Title,
            Content = kb.Content,
            Summary = kb.Summary,
            Category = kb.Category,
            Status = (int)kb.Status,
            StatusText = GetStatusText(kb.Status),
            IsExpired = kb.IsExpired,
            ExpiryDate = kb.ExpiryDate,
            ViewCount = kb.ViewCount,
            UseCount = kb.UseCount,
            HelpfulCount = kb.HelpfulCount,
            NotHelpfulCount = kb.NotHelpfulCount,
            Remark = kb.Remark,
            ProcessingResult = kb.ProcessingResult,
            AuthorId = kb.AuthorId,
            AuthorName = kb.Author?.FullName,
            ReviewerId = kb.ReviewerId,
            ReviewerName = kb.Reviewer?.FullName,
            CreatedAt = kb.CreatedAt,
            UpdatedAt = kb.UpdatedAt,
            LastUsedAt = kb.LastUsedAt,
            LastReviewAt = kb.LastReviewAt,
            Tags = kb.Tags
        };

        return dto;
    }
}
