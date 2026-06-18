using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface ILeaveService
{
    Task<List<LeaveRecordDto>> GetLeaveRecordsAsync(int? studentId = null, LeaveStatus? status = null);
    Task<LeaveRecordDto> CreateLeaveAsync(CreateLeaveDto dto, int operatorId);
    Task<LeaveRecordDto> ProcessLeaveAsync(ProcessLeaveDto dto, int operatorId);
}

public class LeaveService : ILeaveService
{
    private readonly AppDbContext _context;
    private readonly IOperationLogService _logService;
    private readonly INotificationService _notificationService;
    private readonly IHoursWarningService _hoursWarningService;
    private readonly ICacheService _cache;

    public LeaveService(AppDbContext context, IOperationLogService logService,
        INotificationService notificationService, IHoursWarningService hoursWarningService, ICacheService cache)
    {
        _context = context;
        _logService = logService;
        _notificationService = notificationService;
        _hoursWarningService = hoursWarningService;
        _cache = cache;
    }

    public async Task<List<LeaveRecordDto>> GetLeaveRecordsAsync(int? studentId = null, LeaveStatus? status = null)
    {
        var query = _context.LeaveRecords.AsQueryable();
        if (studentId.HasValue) query = query.Where(l => l.StudentId == studentId.Value);
        if (status.HasValue) query = query.Where(l => l.Status == status.Value);

        var records = await query
            .Include(l => l.Student)
            .Include(l => l.Schedule).ThenInclude(s => s.Class)
            .OrderByDescending(l => l.CreatedAt)
            .Take(200)
            .ToListAsync();

        return records.Select(MapToDto).ToList();
    }

    public async Task<LeaveRecordDto> CreateLeaveAsync(CreateLeaveDto dto, int operatorId)
    {
        var record = new LeaveRecord
        {
            StudentId = dto.StudentId,
            ScheduleId = dto.ScheduleId,
            Reason = dto.Reason,
            Status = LeaveStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.LeaveRecords.Add(record);
        await _context.SaveChangesAsync();

        var admins = await _context.Users
            .Where(u => (u.Role == UserRole.Admin || u.Role == UserRole.Principal) && u.IsActive)
            .Select(u => u.Id)
            .ToListAsync();

        var student = await _context.Students.FindAsync(dto.StudentId);
        foreach (var adminId in admins)
        {
            await _notificationService.SendNotificationAsync(dto.StudentId, adminId, NotificationType.HomeFeedback,
                "请假申请待审批", $"学生 {student?.RealName} 提交了请假申请：{dto.Reason}", "LeaveRecord", record.Id);
        }

        await _logService.LogAsync(OperationType.LeaveApproval, operatorId, "LeaveRecord", record.Id,
            null, dto, $"提交请假申请：{dto.Reason}");

        return MapToDto(record);
    }

    public async Task<LeaveRecordDto> ProcessLeaveAsync(ProcessLeaveDto dto, int operatorId)
    {
        var record = await _context.LeaveRecords
            .Include(l => l.Schedule)
            .Include(l => l.Student)
            .FirstOrDefaultAsync(l => l.Id == dto.LeaveId)
            ?? throw new InvalidOperationException("请假记录不存在");

        if (record.Status != LeaveStatus.Pending)
            throw new InvalidOperationException("该请假已处理");

        var before = new { record.Status, record.HoursDeducted };

        record.Status = dto.Approve ? LeaveStatus.Approved : LeaveStatus.Rejected;
        record.ApprovedAt = DateTime.UtcNow;
        record.ApprovedById = operatorId;
        record.UpdatedAt = DateTime.UtcNow;

        if (dto.Approve && dto.DeductHours && !record.HoursDeducted)
        {
            if (record.Student == null || record.Schedule == null)
                throw new InvalidOperationException("信息缺失");

            if (record.Student.RemainingHours < record.Schedule.DurationHours)
                throw new InvalidOperationException("学生课时不足");

            record.Student.UsedHours += record.Schedule.DurationHours;
            record.HoursDeducted = true;

            var attendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.ScheduleId == record.ScheduleId && a.StudentId == record.StudentId);
            if (attendance != null)
            {
                attendance.Status = AttendanceStatus.Leave;
                attendance.HoursDeducted = true;
            }

            await _hoursWarningService.CheckAndWarnAsync(record.StudentId, operatorId);
        }

        if (!dto.Approve)
        {
            record.RejectReason = dto.RejectReason;
        }

        await _context.SaveChangesAsync();

        await _notificationService.SendNotificationAsync(operatorId, record.StudentId,
            dto.Approve ? NotificationType.LeaveApproved : NotificationType.LeaveRejected,
            dto.Approve ? "请假已批准" : "请假已拒绝",
            dto.Approve
                ? $"您的请假申请已批准{(dto.DeductHours ? "，已扣除相应课时" : "")}"
                : $"您的请假申请已拒绝，原因：{dto.RejectReason}",
            "LeaveRecord", record.Id);

        await _logService.LogAsync(OperationType.LeaveApproval, operatorId, "LeaveRecord", dto.LeaveId,
            before, new { dto.Approve, dto.DeductHours, dto.RejectReason },
            dto.Approve ? $"批准请假" + (dto.DeductHours ? "并扣课时" : "") : $"拒绝请假：{dto.RejectReason}");

        await _cache.RemoveByPrefixAsync("schedules:");
        await _cache.RemoveByPrefixAsync("attendance:");
        return MapToDto(record);
    }

    private static LeaveRecordDto MapToDto(LeaveRecord l)
    {
        return new LeaveRecordDto
        {
            Id = l.Id,
            StudentId = l.StudentId,
            StudentName = l.Student?.RealName ?? string.Empty,
            ScheduleId = l.ScheduleId,
            ScheduleStartTime = l.Schedule?.StartTime ?? default,
            ClassName = l.Schedule?.Class?.Name ?? string.Empty,
            Reason = l.Reason,
            Status = l.Status,
            HoursDeducted = l.HoursDeducted,
            CreatedAt = l.CreatedAt
        };
    }
}
