using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface IFeedbackService
{
    Task<List<WorkFeedbackDto>> GetWorkFeedbacksAsync(int? studentId = null, int? scheduleId = null);
    Task<WorkFeedbackDto> CreateWorkFeedbackAsync(CreateWorkFeedbackDto dto, int operatorId);
    Task<List<HomeSchoolFeedbackDto>> GetHomeSchoolFeedbacksAsync(int? studentId = null, bool pendingRemindersOnly = false);
    Task<HomeSchoolFeedbackDto> CreateHomeSchoolFeedbackAsync(CreateHomeSchoolFeedbackDto dto, int operatorId);
    Task MarkHomeFeedbackAsReadAsync(int feedbackId, int studentId);
    Task NotifyParentForWorkFeedbackAsync(int feedbackId, int operatorId);
    Task<List<WorkFeedbackDto>> GetStudentWorkFeedbacksAsync(int studentId);
}

public class FeedbackService : IFeedbackService
{
    private readonly AppDbContext _context;
    private readonly IOperationLogService _logService;
    private readonly INotificationService _notificationService;
    private readonly ICacheService _cache;

    public FeedbackService(AppDbContext context, IOperationLogService logService,
        INotificationService notificationService, ICacheService cache)
    {
        _context = context;
        _logService = logService;
        _notificationService = notificationService;
        _cache = cache;
    }

    public async Task<List<WorkFeedbackDto>> GetWorkFeedbacksAsync(int? studentId = null, int? scheduleId = null)
    {
        var query = _context.WorkFeedbacks.AsQueryable();
        if (studentId.HasValue) query = query.Where(f => f.StudentId == studentId.Value);
        if (scheduleId.HasValue) query = query.Where(f => f.ScheduleId == scheduleId.Value);

        var feedbacks = await query
            .Include(f => f.Student)
            .Include(f => f.Teacher)
            .Include(f => f.Schedule).ThenInclude(s => s.Class)
            .OrderByDescending(f => f.CreatedAt)
            .Take(200)
            .ToListAsync();

        return feedbacks.Select(MapWorkFeedbackDto).ToList();
    }

    public async Task<List<WorkFeedbackDto>> GetStudentWorkFeedbacksAsync(int studentId)
    {
        var cacheKey = $"student:feedbacks:{studentId}";
        var cached = await _cache.GetAsync<List<WorkFeedbackDto>>(cacheKey);
        if (cached != null) return cached;

        var result = await GetWorkFeedbacksAsync(studentId);
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10));
        return result;
    }

    public async Task<WorkFeedbackDto> CreateWorkFeedbackAsync(CreateWorkFeedbackDto dto, int operatorId)
    {
        var feedback = new WorkFeedback
        {
            ScheduleId = dto.ScheduleId,
            StudentId = dto.StudentId,
            TeacherId = operatorId,
            WorkTitle = dto.WorkTitle,
            WorkImageUrl = dto.WorkImageUrl,
            Feedback = dto.Feedback,
            Score = dto.Score,
            Suggestions = dto.Suggestions,
            ParentNotified = dto.NotifyParent,
            ParentNotifiedAt = dto.NotifyParent ? DateTime.UtcNow : null,
            CreatedAt = DateTime.UtcNow
        };

        _context.WorkFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        if (dto.NotifyParent)
        {
            var student = await _context.Students.FindAsync(dto.StudentId);
            await _notificationService.SendNotificationAsync(operatorId, dto.StudentId,
                NotificationType.WorkFeedback, "新的作品反馈",
                $"{dto.WorkTitle} - 得分：{dto.Score}分。{dto.Feedback}",
                "WorkFeedback", feedback.Id);
        }

        await _logService.LogAsync(OperationType.WorkFeedback, operatorId, "WorkFeedback", feedback.Id,
            null, dto, $"创建作品反馈：{dto.WorkTitle}，得分 {dto.Score}" + (dto.NotifyParent ? "，已通知家长" : ""));

        await _cache.RemoveByPrefixAsync("student:feedbacks:");
        return MapWorkFeedbackDto(feedback);
    }

    public async Task NotifyParentForWorkFeedbackAsync(int feedbackId, int operatorId)
    {
        var feedback = await _context.WorkFeedbacks
            .Include(f => f.Student)
            .FirstOrDefaultAsync(f => f.Id == feedbackId)
            ?? throw new InvalidOperationException("反馈不存在");

        if (feedback.ParentNotified) return;

        var before = new { feedback.ParentNotified };
        feedback.ParentNotified = true;
        feedback.ParentNotifiedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(operatorId, feedback.StudentId,
            NotificationType.WorkFeedback, "新的作品反馈",
            $"{feedback.WorkTitle} - 得分：{feedback.Score}分。{feedback.Feedback}",
            "WorkFeedback", feedbackId);

        await _logService.LogAsync(OperationType.ParentNotification, operatorId, "WorkFeedback", feedbackId,
            before, new { ParentNotified = true }, "通知家长查看作品反馈");
    }

    public async Task<List<HomeSchoolFeedbackDto>> GetHomeSchoolFeedbacksAsync(int? studentId = null, bool pendingRemindersOnly = false)
    {
        var query = _context.HomeSchoolFeedbacks.AsQueryable();
        if (studentId.HasValue) query = query.Where(f => f.StudentId == studentId.Value);
        if (pendingRemindersOnly) query = query.Where(f => f.IsReminder && !f.ParentRead);

        var feedbacks = await query
            .Include(f => f.Student)
            .Include(f => f.CreatedBy)
            .OrderByDescending(f => f.CreatedAt)
            .Take(200)
            .ToListAsync();

        return feedbacks.Select(MapHomeSchoolFeedbackDto).ToList();
    }

    public async Task<HomeSchoolFeedbackDto> CreateHomeSchoolFeedbackAsync(CreateHomeSchoolFeedbackDto dto, int operatorId)
    {
        var feedback = new HomeSchoolFeedback
        {
            StudentId = dto.StudentId,
            CreatedById = operatorId,
            Type = dto.Type,
            Content = dto.Content,
            IsReminder = dto.IsReminder,
            ReminderDate = dto.ReminderDate,
            IncludedInReport = dto.IncludeInMonthlyReport,
            CreatedAt = DateTime.UtcNow
        };

        _context.HomeSchoolFeedbacks.Add(feedback);
        await _context.SaveChangesAsync();

        var student = await _context.Students.FindAsync(dto.StudentId);
        await _notificationService.SendNotificationAsync(operatorId, dto.StudentId,
            NotificationType.HomeFeedback, "家校反馈提醒",
            $"{dto.Type}: {dto.Content}",
            "HomeSchoolFeedback", feedback.Id);

        await _logService.LogAsync(OperationType.FeedbackReply, operatorId, "HomeSchoolFeedback", feedback.Id,
            null, dto, $"创建家校反馈：{dto.Type}" + (dto.IsReminder ? "，设置提醒" : "") + (dto.IncludeInMonthlyReport ? "，纳入月报" : ""));

        return MapHomeSchoolFeedbackDto(feedback);
    }

    public async Task MarkHomeFeedbackAsReadAsync(int feedbackId, int studentId)
    {
        var feedback = await _context.HomeSchoolFeedbacks
            .FirstOrDefaultAsync(f => f.Id == feedbackId && f.StudentId == studentId);
        if (feedback == null || feedback.ParentRead) return;

        feedback.ParentRead = true;
        feedback.ParentReadAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    private static WorkFeedbackDto MapWorkFeedbackDto(WorkFeedback f)
    {
        return new WorkFeedbackDto
        {
            Id = f.Id,
            ScheduleId = f.ScheduleId,
            ClassName = f.Schedule?.Class?.Name ?? string.Empty,
            ScheduleDate = f.Schedule?.StartTime ?? default,
            StudentId = f.StudentId,
            StudentName = f.Student?.RealName ?? string.Empty,
            TeacherId = f.TeacherId,
            TeacherName = f.Teacher?.RealName ?? string.Empty,
            WorkTitle = f.WorkTitle,
            WorkImageUrl = f.WorkImageUrl,
            Feedback = f.Feedback,
            Score = f.Score,
            Suggestions = f.Suggestions,
            ParentNotified = f.ParentNotified,
            CreatedAt = f.CreatedAt
        };
    }

    private static HomeSchoolFeedbackDto MapHomeSchoolFeedbackDto(HomeSchoolFeedback f)
    {
        return new HomeSchoolFeedbackDto
        {
            Id = f.Id,
            StudentId = f.StudentId,
            StudentName = f.Student?.RealName ?? string.Empty,
            CreatedById = f.CreatedById,
            CreatedByName = f.CreatedBy?.RealName ?? string.Empty,
            Type = f.Type,
            Content = f.Content,
            IsReminder = f.IsReminder,
            ReminderDate = f.ReminderDate,
            ParentRead = f.ParentRead,
            CreatedAt = f.CreatedAt
        };
    }
}
