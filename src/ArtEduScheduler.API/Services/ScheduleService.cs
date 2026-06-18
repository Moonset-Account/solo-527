using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface IScheduleService
{
    Task<List<ScheduleDto>> GetSchedulesAsync(int? classId = null, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<ScheduleDto>> GetStudentSchedulesAsync(int studentId, DateTime? startDate = null, DateTime? endDate = null);
    Task<ScheduleDto?> GetScheduleByIdAsync(int id);
    Task<ScheduleDto> CreateScheduleAsync(CreateScheduleDto dto, int operatorId);
    Task<ScheduleDto> RescheduleAsync(RescheduleDto dto, int operatorId);
    Task CancelScheduleAsync(int scheduleId, string reason, int operatorId);
    Task<BatchOperationDto> BatchCreateSchedulesAsync(List<CreateScheduleDto> dtos, int operatorId);
}

public class ScheduleService : IScheduleService
{
    private readonly AppDbContext _context;
    private readonly IOperationLogService _logService;
    private readonly INotificationService _notificationService;
    private readonly ICacheService _cache;
    private readonly IBatchOperationService _batchService;

    public ScheduleService(AppDbContext context, IOperationLogService logService,
        INotificationService notificationService, ICacheService cache, IBatchOperationService batchService)
    {
        _context = context;
        _logService = logService;
        _notificationService = notificationService;
        _cache = cache;
        _batchService = batchService;
    }

    public async Task<List<ScheduleDto>> GetSchedulesAsync(int? classId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        var cacheKey = $"schedules:{classId}:{startDate?.ToString("yyyyMMdd")}:{endDate?.ToString("yyyyMMdd")}";
        var cached = await _cache.GetAsync<List<ScheduleDto>>(cacheKey);
        if (cached != null) return cached;

        var query = _context.Schedules.AsQueryable();
        if (classId.HasValue) query = query.Where(s => s.ClassId == classId.Value);
        if (startDate.HasValue) query = query.Where(s => s.StartTime >= startDate.Value);
        if (endDate.HasValue) query = query.Where(s => s.StartTime <= endDate.Value);

        var schedules = await query
            .Include(s => s.Class).ThenInclude(c => c.Teacher)
            .OrderBy(s => s.StartTime)
            .Take(500)
            .ToListAsync();

        var result = schedules.Select(MapToDto).ToList();
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5));
        return result;
    }

    public async Task<List<ScheduleDto>> GetStudentSchedulesAsync(int studentId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var classIds = await _context.StudentClasses
            .Where(sc => sc.StudentId == studentId && sc.IsActive)
            .Select(sc => sc.ClassId)
            .ToListAsync();

        return await GetSchedulesAsync(null, startDate, endDate)
            .ContinueWith(t => t.Result.Where(s => classIds.Contains(s.ClassId)).ToList());
    }

    public async Task<ScheduleDto?> GetScheduleByIdAsync(int id)
    {
        var schedule = await _context.Schedules
            .Include(s => s.Class).ThenInclude(c => c.Teacher)
            .FirstOrDefaultAsync(s => s.Id == id);
        return schedule == null ? null : MapToDto(schedule);
    }

    public async Task<ScheduleDto> CreateScheduleAsync(CreateScheduleDto dto, int operatorId)
    {
        var cls = await _context.Classes.FindAsync(dto.ClassId)
                  ?? throw new InvalidOperationException("班级不存在");

        var schedule = new Schedule
        {
            ClassId = dto.ClassId,
            StartTime = dto.StartTime,
            EndTime = dto.EndTime,
            Classroom = dto.Classroom,
            DurationHours = dto.DurationHours,
            Notes = dto.Notes,
            Status = ScheduleStatus.Scheduled,
            CreatedAt = DateTime.UtcNow
        };

        _context.Schedules.Add(schedule);
        await _context.SaveChangesAsync();

        var studentIds = await _context.StudentClasses
            .Where(sc => sc.ClassId == dto.ClassId && sc.IsActive)
            .Select(sc => sc.StudentId)
            .ToListAsync();

        foreach (var sid in studentIds)
        {
            _context.Attendances.Add(new Attendance
            {
                ScheduleId = schedule.Id,
                StudentId = sid,
                Status = AttendanceStatus.NotMarked,
                HoursDeducted = false
            });
        }
        await _context.SaveChangesAsync();

        await _logService.LogAsync(OperationType.ScheduleChange, operatorId, "Schedule", schedule.Id,
            null, dto, $"创建课程安排：{cls.Name} {dto.StartTime:yyyy-MM-dd HH:mm}");

        await NotifyScheduleChange(schedule, studentIds, "新课程安排", $"您有新的课程：{cls.Name}，时间：{dto.StartTime:yyyy-MM-dd HH:mm}");

        await _cache.RemoveByPrefixAsync("schedules:");
        return MapToDto(schedule);
    }

    public async Task<ScheduleDto> RescheduleAsync(RescheduleDto dto, int operatorId)
    {
        var original = await _context.Schedules
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == dto.ScheduleId)
            ?? throw new InvalidOperationException("课表不存在");

        var before = new { original.StartTime, original.EndTime, original.Classroom, original.Status };

        original.Status = ScheduleStatus.Rescheduled;
        original.UpdatedAt = DateTime.UtcNow;

        var newSchedule = new Schedule
        {
            ClassId = original.ClassId,
            StartTime = dto.NewStartTime,
            EndTime = dto.NewEndTime,
            Classroom = dto.Classroom,
            DurationHours = original.DurationHours,
            Notes = dto.Reason,
            Status = ScheduleStatus.Scheduled,
            OriginalScheduleId = dto.ScheduleId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Schedules.Add(newSchedule);

        var attendances = await _context.Attendances
            .Where(a => a.ScheduleId == dto.ScheduleId)
            .ToListAsync();

        foreach (var att in attendances)
        {
            _context.Attendances.Add(new Attendance
            {
                ScheduleId = newSchedule.Id,
                StudentId = att.StudentId,
                Status = AttendanceStatus.NotMarked,
                HoursDeducted = false
            });
        }

        await _context.SaveChangesAsync();

        await _logService.LogAsync(OperationType.ScheduleChange, operatorId, "Schedule", dto.ScheduleId,
            before, new { dto.NewStartTime, dto.NewEndTime, dto.Classroom, dto.Reason },
            $"调课：{original.Class?.Name} 从 {before.StartTime:yyyy-MM-dd HH:mm} 改为 {dto.NewStartTime:yyyy-MM-dd HH:mm}");

        var studentIds = attendances.Select(a => a.StudentId).ToList();
        await NotifyScheduleChange(newSchedule, studentIds, "课程时间调整",
            $"您的课程时间已调整：{original.Class?.Name}，新时间：{dto.NewStartTime:yyyy-MM-dd HH:mm}，原因：{dto.Reason}");

        await _cache.RemoveByPrefixAsync("schedules:");
        return MapToDto(newSchedule);
    }

    public async Task CancelScheduleAsync(int scheduleId, string reason, int operatorId)
    {
        var schedule = await _context.Schedules
            .Include(s => s.Class)
            .FirstOrDefaultAsync(s => s.Id == scheduleId)
            ?? throw new InvalidOperationException("课表不存在");

        var before = new { schedule.Status };
        schedule.Status = ScheduleStatus.Cancelled;
        schedule.Notes = string.IsNullOrEmpty(schedule.Notes) ? reason : $"{schedule.Notes}; {reason}";
        schedule.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var studentIds = await _context.Attendances
            .Where(a => a.ScheduleId == scheduleId)
            .Select(a => a.StudentId)
            .ToListAsync();

        await _logService.LogAsync(OperationType.ScheduleChange, operatorId, "Schedule", scheduleId,
            before, new { Status = ScheduleStatus.Cancelled }, $"取消课程：{schedule.Class?.Name}，原因：{reason}");

        await NotifyScheduleChange(schedule, studentIds, "课程取消",
            $"您的课程已取消：{schedule.Class?.Name}，原定时间：{schedule.StartTime:yyyy-MM-dd HH:mm}，原因：{reason}");

        await _cache.RemoveByPrefixAsync("schedules:");
    }

    public async Task<BatchOperationDto> BatchCreateSchedulesAsync(List<CreateScheduleDto> dtos, int operatorId)
    {
        var result = new BatchOperationResult<ScheduleDto>
        {
            TotalCount = dtos.Count
        };

        foreach (var dto in dtos)
        {
            try
            {
                var schedule = await CreateScheduleAsync(dto, operatorId);
                result.SuccessItems.Add(schedule);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailedItems.Add(new BatchFailedItem
                {
                    ItemId = dto.ClassId,
                    ItemName = $"{dto.ClassId}-{dto.StartTime:yyyy-MM-dd}",
                    ErrorMessage = ex.Message,
                    ItemData = dto
                });
                result.FailedCount++;
            }
        }

        result.Summary = $"批量创建课表完成：成功 {result.SuccessCount} 条，失败 {result.FailedCount} 条，共 {result.TotalCount} 条";
        return await _batchService.SaveBatchResultAsync("BatchCreateSchedules", operatorId, result);
    }

    private async Task NotifyScheduleChange(Schedule schedule, List<int> studentIds, string title, string content)
    {
        foreach (var sid in studentIds)
        {
            await _notificationService.SendNotificationAsync(0, sid, NotificationType.ScheduleChange,
                title, content, "Schedule", schedule.Id);
        }
    }

    private static ScheduleDto MapToDto(Schedule s)
    {
        return new ScheduleDto
        {
            Id = s.Id,
            ClassId = s.ClassId,
            ClassName = s.Class?.Name ?? string.Empty,
            TeacherName = s.Class?.Teacher?.RealName,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            Classroom = s.Classroom,
            Status = s.Status,
            DurationHours = s.DurationHours,
            Notes = s.Notes
        };
    }
}
