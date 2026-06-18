using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface IReportService
{
    Task<MonthlyReportDto> GenerateMonthlyReportAsync(int year, int month, int? studentId = null);
    Task<List<MonthlyReportDto>> GetMonthlyReportsAsync(int year, int month);
    Task<MonthlyReportDto?> GetStudentMonthlyReportAsync(int year, int month, int studentId);
}

public class ReportService : IReportService
{
    private readonly AppDbContext _context;
    private readonly ICacheService _cache;

    public ReportService(AppDbContext context, ICacheService cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<MonthlyReportDto> GenerateMonthlyReportAsync(int year, int month, int? studentId = null)
    {
        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1).AddDays(-1);

        var students = studentId.HasValue
            ? await _context.Students.Where(s => s.Id == studentId.Value).ToListAsync()
            : await _context.Students.ToListAsync();

        MonthlyReportDto? lastReport = null;

        foreach (var student in students)
        {
            var attendanceStats = await _context.Attendances
                .Where(a => a.StudentId == student.Id
                            && a.Schedule != null
                            && a.Schedule.StartTime >= startDate
                            && a.Schedule.StartTime <= endDate)
                .GroupBy(a => a.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            var totalHoursUsed = await _context.Attendances
                .Where(a => a.StudentId == student.Id
                            && a.HoursDeducted
                            && a.Schedule != null
                            && a.Schedule.StartTime >= startDate
                            && a.Schedule.StartTime <= endDate)
                .SumAsync(a => a.Schedule!.DurationHours);

            var feedbacks = await _context.HomeSchoolFeedbacks
                .Where(f => f.StudentId == student.Id
                            && f.IncludedInReport
                            && f.CreatedAt >= startDate
                            && f.CreatedAt <= endDate)
                .Include(f => f.CreatedBy)
                .ToListAsync();

            var workFeedbacks = await _context.WorkFeedbacks
                .Where(f => f.StudentId == student.Id
                            && f.CreatedAt >= startDate
                            && f.CreatedAt <= endDate)
                .ToListAsync();

            var avgScore = workFeedbacks.Count > 0 ? workFeedbacks.Average(f => f.Score) : 0;

            var attendedCount = attendanceStats.FirstOrDefault(s => s.Status == AttendanceStatus.Present)?.Count ?? 0;
            var absentCount = attendanceStats.FirstOrDefault(s => s.Status == AttendanceStatus.Absent)?.Count ?? 0;
            var leaveCount = attendanceStats.FirstOrDefault(s => s.Status == AttendanceStatus.Leave)?.Count ?? 0;
            var totalClasses = attendedCount + absentCount + leaveCount;

            var existingReport = await _context.ReportMonthlies
                .FirstOrDefaultAsync(r => r.Year == year && r.Month == month && r.StudentId == student.Id);

            var feedbacksSummary = feedbacks.Count > 0
                ? string.Join("; ", feedbacks.Take(10).Select(f => $"[{f.Type}] {f.CreatedBy?.RealName}: {f.Content}"))
                : null;

            if (existingReport == null)
            {
                var report = new ReportMonthly
                {
                    Year = year,
                    Month = month,
                    StudentId = student.Id,
                    TotalClasses = totalClasses,
                    AttendedClasses = attendedCount,
                    AbsentClasses = absentCount,
                    LeaveClasses = leaveCount,
                    TotalHoursUsed = totalHoursUsed,
                    FeedbackCount = feedbacks.Count,
                    AverageScore = (decimal)avgScore,
                    FeedbacksSummary = feedbacksSummary,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ReportMonthlies.Add(report);
            }
            else
            {
                existingReport.TotalClasses = totalClasses;
                existingReport.AttendedClasses = attendedCount;
                existingReport.AbsentClasses = absentCount;
                existingReport.LeaveClasses = leaveCount;
                existingReport.TotalHoursUsed = totalHoursUsed;
                existingReport.FeedbackCount = feedbacks.Count;
                existingReport.AverageScore = (decimal)avgScore;
                existingReport.FeedbacksSummary = feedbacksSummary;
                existingReport.UpdatedAt = DateTime.UtcNow;
            }
        }

        await _context.SaveChangesAsync();
        await _cache.RemoveByPrefixAsync("reports:");

        var result = studentId.HasValue
            ? await GetStudentMonthlyReportAsync(year, month, studentId.Value)
            : (await GetMonthlyReportsAsync(year, month)).FirstOrDefault();

        return result!;
    }

    public async Task<List<MonthlyReportDto>> GetMonthlyReportsAsync(int year, int month)
    {
        var cacheKey = $"reports:{year}:{month}";
        var cached = await _cache.GetAsync<List<MonthlyReportDto>>(cacheKey);
        if (cached != null) return cached;

        var reports = await _context.ReportMonthlies
            .Where(r => r.Year == year && r.Month == month)
            .Include(r => r.Student)
            .ToListAsync();

        var result = reports.Select(r => new MonthlyReportDto
        {
            Id = r.Id,
            Year = r.Year,
            Month = r.Month,
            StudentId = r.StudentId,
            StudentName = r.Student?.RealName,
            TotalClasses = r.TotalClasses,
            AttendedClasses = r.AttendedClasses,
            AbsentClasses = r.AbsentClasses,
            LeaveClasses = r.LeaveClasses,
            TotalHoursUsed = r.TotalHoursUsed,
            FeedbackCount = r.FeedbackCount,
            AverageScore = r.AverageScore,
            Notes = r.Notes
        }).ToList();

        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(30));
        return result;
    }

    public async Task<MonthlyReportDto?> GetStudentMonthlyReportAsync(int year, int month, int studentId)
    {
        var report = await _context.ReportMonthlies
            .Include(r => r.Student)
            .FirstOrDefaultAsync(r => r.Year == year && r.Month == month && r.StudentId == studentId);

        if (report == null) return null;

        var startDate = new DateTime(year, month, 1);
        var endDate = startDate.AddMonths(1);

        var feedbacks = await _context.HomeSchoolFeedbacks
            .Where(f => f.StudentId == studentId && f.IncludedInReport
                        && f.CreatedAt >= startDate && f.CreatedAt < endDate)
            .Include(f => f.CreatedBy)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();

        return new MonthlyReportDto
        {
            Id = report.Id,
            Year = report.Year,
            Month = report.Month,
            StudentId = report.StudentId,
            StudentName = report.Student?.RealName,
            TotalClasses = report.TotalClasses,
            AttendedClasses = report.AttendedClasses,
            AbsentClasses = report.AbsentClasses,
            LeaveClasses = report.LeaveClasses,
            TotalHoursUsed = report.TotalHoursUsed,
            FeedbackCount = report.FeedbackCount,
            AverageScore = report.AverageScore,
            Feedbacks = feedbacks.Select(f => new HomeSchoolFeedbackDto
            {
                Id = f.Id,
                StudentId = f.StudentId,
                StudentName = report.Student?.RealName ?? string.Empty,
                CreatedById = f.CreatedById,
                CreatedByName = f.CreatedBy?.RealName ?? string.Empty,
                Type = f.Type,
                Content = f.Content,
                IsReminder = f.IsReminder,
                ReminderDate = f.ReminderDate,
                ParentRead = f.ParentRead,
                CreatedAt = f.CreatedAt
            }).ToList(),
            Notes = report.Notes
        };
    }
}
