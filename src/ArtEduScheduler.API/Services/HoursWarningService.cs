using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface IHoursWarningService
{
    Task CheckAndWarnAsync(int studentId, int operatorId);
    Task<List<HoursWarningDto>> GetActiveWarningsAsync(bool onlyUnnotified = false);
    Task MarkWarningResolvedAsync(int warningId, int operatorId);
    Task<List<HoursWarningDto>> GetStudentWarningsAsync(int studentId);
}

public class HoursWarningService : IHoursWarningService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IOperationLogService _logService;
    private const int WarningThreshold = 5;

    public HoursWarningService(AppDbContext context, INotificationService notificationService, IOperationLogService logService)
    {
        _context = context;
        _notificationService = notificationService;
        _logService = logService;
    }

    public async Task CheckAndWarnAsync(int studentId, int operatorId)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return;

        if (student.RemainingHours <= WarningThreshold)
        {
            var existingWarning = await _context.HoursWarnings
                .FirstOrDefaultAsync(w => w.StudentId == studentId && !w.Resolved);

            if (existingWarning != null) return;

            var advisors = await _context.Users
                .Where(u => u.Role == UserRole.AdmissionAdvisor && u.IsActive)
                .ToListAsync();

            var warning = new HoursWarning
            {
                StudentId = studentId,
                RemainingHours = student.RemainingHours,
                ThresholdHours = WarningThreshold,
                NotifiedAdvisor = advisors.Count > 0,
                CreatedAt = DateTime.UtcNow
            };

            if (advisors.Count > 0)
            {
                var advisor = advisors.First();
                warning.AdvisorId = advisor.Id;
                warning.NotifiedAt = DateTime.UtcNow;

                await _notificationService.SendNotificationAsync(0, advisor.Id,
                    NotificationType.HoursInsufficient, "学生课时不足提醒",
                    $"学生 {student.RealName} 剩余课时不足，当前剩余 {student.RemainingHours} 课时，请及时联系家长续费。",
                    "Student", studentId);
            }

            _context.HoursWarnings.Add(warning);
            await _context.SaveChangesAsync();

            await _logService.LogAsync(OperationType.ParentNotification, operatorId, "HoursWarning", warning.Id,
                null, new { student.RemainingHours, WarningThreshold },
                $"触发课时不足预警：学生 {student.RealName} 剩余 {student.RemainingHours} 课时");
        }
    }

    public async Task<List<HoursWarningDto>> GetActiveWarningsAsync(bool onlyUnnotified = false)
    {
        var query = _context.HoursWarnings.Where(w => !w.Resolved);
        if (onlyUnnotified) query = query.Where(w => !w.NotifiedAdvisor);

        var warnings = await query
            .Include(w => w.Student)
            .Include(w => w.Advisor)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return warnings.Select(MapToDto).ToList();
    }

    public async Task<List<HoursWarningDto>> GetStudentWarningsAsync(int studentId)
    {
        var warnings = await _context.HoursWarnings
            .Where(w => w.StudentId == studentId)
            .Include(w => w.Student)
            .Include(w => w.Advisor)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return warnings.Select(MapToDto).ToList();
    }

    public async Task MarkWarningResolvedAsync(int warningId, int operatorId)
    {
        var warning = await _context.HoursWarnings.FindAsync(warningId)
                      ?? throw new InvalidOperationException("预警记录不存在");

        if (warning.Resolved) return;

        warning.Resolved = true;
        await _context.SaveChangesAsync();

        await _logService.LogAsync(OperationType.ParentNotification, operatorId, "HoursWarning", warningId,
            new { Resolved = false }, new { Resolved = true }, "标记课时不足预警已处理");
    }

    private static HoursWarningDto MapToDto(HoursWarning w)
    {
        return new HoursWarningDto
        {
            Id = w.Id,
            StudentId = w.StudentId,
            StudentName = w.Student?.RealName ?? string.Empty,
            RemainingHours = w.RemainingHours,
            ThresholdHours = w.ThresholdHours,
            NotifiedAdvisor = w.NotifiedAdvisor,
            AdvisorName = w.Advisor?.RealName,
            NotifiedAt = w.NotifiedAt,
            Resolved = w.Resolved
        };
    }
}
