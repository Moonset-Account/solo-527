using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface IAttendanceService
{
    Task<List<AttendanceDto>> GetScheduleAttendancesAsync(int scheduleId);
    Task<List<AttendanceDto>> GetStudentAttendancesAsync(int studentId, DateTime? startDate = null, DateTime? endDate = null);
    Task<AttendanceDto> MarkAttendanceAsync(MarkAttendanceDto dto, int operatorId);
    Task<BatchOperationDto> BatchMarkAttendancesAsync(BatchAttendanceDto dto, int operatorId);
}

public class AttendanceService : IAttendanceService
{
    private readonly AppDbContext _context;
    private readonly IOperationLogService _logService;
    private readonly IHoursWarningService _hoursWarningService;
    private readonly IBatchOperationService _batchService;
    private readonly ICacheService _cache;

    public AttendanceService(AppDbContext context, IOperationLogService logService,
        IHoursWarningService hoursWarningService, IBatchOperationService batchService, ICacheService cache)
    {
        _context = context;
        _logService = logService;
        _hoursWarningService = hoursWarningService;
        _batchService = batchService;
        _cache = cache;
    }

    public async Task<List<AttendanceDto>> GetScheduleAttendancesAsync(int scheduleId)
    {
        var attendances = await _context.Attendances
            .Where(a => a.ScheduleId == scheduleId)
            .Include(a => a.Student)
            .ToListAsync();

        return attendances.Select(MapToDto).ToList();
    }

    public async Task<List<AttendanceDto>> GetStudentAttendancesAsync(int studentId, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Attendances.Where(a => a.StudentId == studentId);
        if (startDate.HasValue)
            query = query.Where(a => a.Schedule != null && a.Schedule.StartTime >= startDate.Value);
        if (endDate.HasValue)
            query = query.Where(a => a.Schedule != null && a.Schedule.StartTime <= endDate.Value);

        var attendances = await query
            .Include(a => a.Schedule).ThenInclude(s => s.Class)
            .OrderByDescending(a => a.Schedule!.StartTime)
            .Take(200)
            .ToListAsync();

        return attendances.Select(MapToDto).ToList();
    }

    public async Task<AttendanceDto> MarkAttendanceAsync(MarkAttendanceDto dto, int operatorId)
    {
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.ScheduleId == dto.ScheduleId && a.StudentId == dto.StudentId)
            ?? throw new InvalidOperationException("考勤记录不存在");

        var schedule = await _context.Schedules.FindAsync(dto.ScheduleId);
        var student = await _context.Students.FindAsync(dto.StudentId);
        var before = new { attendance.Status, attendance.HoursDeducted, attendance.Notes };

        attendance.Status = dto.Status;
        attendance.Notes = dto.Notes;
        attendance.MarkedAt = DateTime.UtcNow;
        attendance.MarkedById = operatorId;

        if (dto.DeductHours && dto.Status == AttendanceStatus.Present && !attendance.HoursDeducted)
        {
            if (student == null || schedule == null)
                throw new InvalidOperationException("学生或课表信息缺失");

            if (student.RemainingHours < schedule.DurationHours)
                throw new InvalidOperationException($"学生课时不足，剩余 {student.RemainingHours} 课时，需要 {schedule.DurationHours} 课时");

            student.UsedHours += schedule.DurationHours;
            attendance.HoursDeducted = true;

            await _hoursWarningService.CheckAndWarnAsync(student.Id, operatorId);
        }

        await _context.SaveChangesAsync();

        await _logService.LogAsync(OperationType.HoursDeduction, operatorId, "Attendance", attendance.Id,
            before, new { dto.Status, dto.DeductHours, dto.Notes },
            $"记录考勤：{student?.RealName} - {dto.Status}" + (dto.DeductHours && dto.Status == AttendanceStatus.Present ? $"，扣减{schedule?.DurationHours}课时" : ""));

        await _cache.RemoveByPrefixAsync("schedules:");
        await _cache.RemoveByPrefixAsync("attendance:");
        return MapToDto(attendance);
    }

    public async Task<BatchOperationDto> BatchMarkAttendancesAsync(BatchAttendanceDto dto, int operatorId)
    {
        var result = new BatchOperationResult<AttendanceDto>
        {
            TotalCount = dto.Attendances.Count
        };

        foreach (var item in dto.Attendances)
        {
            try
            {
                var attendance = await MarkAttendanceAsync(item, operatorId);
                result.SuccessItems.Add(attendance);
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                result.FailedItems.Add(new BatchFailedItem
                {
                    ItemId = item.StudentId,
                    ItemName = $"学生{item.StudentId}",
                    ErrorMessage = ex.Message,
                    ItemData = item
                });
                result.FailedCount++;
            }
        }

        result.Summary = $"批量考勤完成：成功 {result.SuccessCount} 条，失败 {result.FailedCount} 条，共 {result.TotalCount} 条";
        return await _batchService.SaveBatchResultAsync("BatchMarkAttendances", operatorId, result);
    }

    private static AttendanceDto MapToDto(Attendance a)
    {
        return new AttendanceDto
        {
            Id = a.Id,
            ScheduleId = a.ScheduleId,
            StudentId = a.StudentId,
            StudentName = a.Student?.RealName ?? string.Empty,
            Status = a.Status,
            HoursDeducted = a.HoursDeducted,
            Notes = a.Notes
        };
    }
}
