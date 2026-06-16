
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class WorkloadReportService : IWorkloadReportService
{
    private readonly AppDbContext _context;

    public WorkloadReportService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<WorkloadReportDto>> GetListAsync(WorkloadReportQueryDto query)
    {
        var queryable = _context.WorkloadReports.AsQueryable();

        if (query.ClinicId.HasValue)
            queryable = queryable.Where(w => w.ClinicId == query.ClinicId.Value);
        if (query.DoctorId.HasValue)
            queryable = queryable.Where(w => w.DoctorId == query.DoctorId.Value);
        if (query.StartDate.HasValue)
            queryable = queryable.Where(w => w.ReportDate.Date >= query.StartDate.Value.Date);
        if (query.EndDate.HasValue)
            queryable = queryable.Where(w => w.ReportDate.Date <= query.EndDate.Value.Date);

        return await queryable
            .OrderByDescending(w => w.ReportDate)
            .ThenBy(w => w.ClinicId)
            .Select(w => MapToDto(w))
            .ToListAsync();
    }

    public async Task<WorkloadReportDto?> GetByIdAsync(int id)
    {
        var report = await _context.WorkloadReports.FindAsync(id);
        return report == null ? null : MapToDto(report);
    }

    public async Task<WorkloadReportDto> GenerateAsync(int doctorId, DateTime reportDate)
    {
        var doctor = await _context.Doctors.FindAsync(doctorId);
        if (doctor == null)
            throw new ArgumentException($"Doctor with id {doctorId} not found");

        var existing = await _context.WorkloadReports
            .FirstOrDefaultAsync(w => w.DoctorId == doctorId && w.ReportDate.Date == reportDate.Date);

        if (existing != null)
        {
            _context.WorkloadReports.Remove(existing);
            await _context.SaveChangesAsync();
        }

        var appointments = await _context.Appointments
            .Where(a => a.DoctorId == doctorId && a.AppointmentDate.Date == reportDate.Date)
            .ToListAsync();

        var totalAppointments = appointments.Count;
        var completedAppointments = appointments.Count(a => a.Status == AppointmentStatus.Completed);
        var cancelledAppointments = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);
        var noShowAppointments = totalAppointments - completedAppointments - cancelledAppointments;

        var followUps = await _context.FollowUps
            .Where(f => f.DoctorId == doctorId && f.PlannedDate.Date == reportDate.Date)
            .ToListAsync();

        var followUpCount = followUps.Count;
        var completedFollowUps = followUps.Count(f => f.Status == FollowUpStatus.Completed);
        var overdueFollowUps = followUps.Count(f => f.IsOverdue);

        var feeItems = await _context.FeeItems
            .Where(f => f.Appointment != null
                && f.Appointment.DoctorId == doctorId
                && f.Status == FeeItemStatus.Paid
                && f.CreatedAt.Date == reportDate.Date)
            .ToListAsync();

        var totalRevenue = feeItems.Sum(f => f.Amount);

        var workloadScore = CalculateWorkloadScore(
            totalAppointments, completedAppointments,
            followUpCount, completedFollowUps,
            totalRevenue);

        var report = new WorkloadReport
        {
            DoctorId = doctorId,
            DoctorName = doctor.Name,
            ClinicId = doctor.ClinicId,
            ClinicName = doctor.Clinic?.Name ?? "",
            ReportDate = reportDate.Date,
            TotalAppointments = totalAppointments,
            CompletedAppointments = completedAppointments,
            CancelledAppointments = cancelledAppointments,
            NoShowAppointments = noShowAppointments,
            FollowUpCount = followUpCount,
            CompletedFollowUps = completedFollowUps,
            OverdueFollowUps = overdueFollowUps,
            TotalRevenue = totalRevenue,
            WorkloadScore = Math.Round(workloadScore, 1),
            SyncSource = "手动生成",
            SyncedAt = DateTime.Now,
            CreatedAt = DateTime.Now
        };

        _context.WorkloadReports.Add(report);
        await _context.SaveChangesAsync();

        return MapToDto(report);
    }

    public async Task<WorkloadReportDto?> SyncFromFollowUpCompletionAsync(int doctorId, DateTime reportDate)
    {
        var doctor = await _context.Doctors.FindAsync(doctorId);
        if (doctor == null) return null;

        var existing = await _context.WorkloadReports
            .FirstOrDefaultAsync(w => w.DoctorId == doctorId && w.ReportDate.Date == reportDate.Date);

        if (existing != null)
        {
            _context.WorkloadReports.Remove(existing);
            await _context.SaveChangesAsync();
        }

        var appointments = await _context.Appointments
            .Where(a => a.DoctorId == doctorId && a.AppointmentDate.Date == reportDate.Date)
            .ToListAsync();

        var totalAppointments = appointments.Count;
        var completedAppointments = appointments.Count(a => a.Status == AppointmentStatus.Completed);
        var cancelledAppointments = appointments.Count(a => a.Status == AppointmentStatus.Cancelled);
        var noShowAppointments = totalAppointments - completedAppointments - cancelledAppointments;

        var followUps = await _context.FollowUps
            .Where(f => f.DoctorId == doctorId && f.PlannedDate.Date == reportDate.Date)
            .ToListAsync();

        var followUpCount = followUps.Count;
        var completedFollowUps = followUps.Count(f => f.Status == FollowUpStatus.Completed);
        var overdueFollowUps = followUps.Count(f => f.IsOverdue);

        var feeItems = await _context.FeeItems
            .Where(f => f.Appointment != null
                && f.Appointment.DoctorId == doctorId
                && f.Status == FeeItemStatus.Paid
                && f.CreatedAt.Date == reportDate.Date)
            .ToListAsync();

        var totalRevenue = feeItems.Sum(f => f.Amount);

        var workloadScore = CalculateWorkloadScore(
            totalAppointments, completedAppointments,
            followUpCount, completedFollowUps,
            totalRevenue);

        var report = new WorkloadReport
        {
            DoctorId = doctorId,
            DoctorName = doctor.Name,
            ClinicId = doctor.ClinicId,
            ClinicName = doctor.Clinic?.Name ?? "",
            ReportDate = reportDate.Date,
            TotalAppointments = totalAppointments,
            CompletedAppointments = completedAppointments,
            CancelledAppointments = cancelledAppointments,
            NoShowAppointments = noShowAppointments,
            FollowUpCount = followUpCount,
            CompletedFollowUps = completedFollowUps,
            OverdueFollowUps = overdueFollowUps,
            TotalRevenue = totalRevenue,
            WorkloadScore = Math.Round(workloadScore, 1),
            SyncSource = "随访办结同步",
            SyncedAt = DateTime.Now,
            CreatedAt = DateTime.Now
        };

        _context.WorkloadReports.Add(report);
        await _context.SaveChangesAsync();

        return MapToDto(report);
    }

    public async Task GenerateDailyReportsAsync(DateTime reportDate)
    {
        var doctors = await _context.Doctors
            .Where(d => d.IsActive)
            .ToListAsync();

        foreach (var doctor in doctors)
        {
            await GenerateAsync(doctor.Id, reportDate);
        }
    }

    private static double CalculateWorkloadScore(
        int totalAppointments, int completedAppointments,
        int followUpCount, int completedFollowUps,
        decimal totalRevenue)
    {
        var appointmentScore = totalAppointments * 5;
        var completionRate = totalAppointments > 0 ? (double)completedAppointments / totalAppointments : 0;
        var completionScore = completionRate * 30;

        var followUpScore = followUpCount * 3;
        var followUpCompletionRate = followUpCount > 0 ? (double)completedFollowUps / followUpCount : 0;
        var followUpCompletionScore = followUpCompletionRate * 20;

        var revenueScore = (double)(totalRevenue / 1000) * 2;

        var totalScore = appointmentScore + completionScore + followUpScore + followUpCompletionScore + revenueScore;
        return Math.Min(100, totalScore);
    }

    private static WorkloadReportDto MapToDto(WorkloadReport report)
    {
        return new WorkloadReportDto
        {
            Id = report.Id,
            DoctorId = report.DoctorId,
            DoctorName = report.DoctorName,
            ClinicId = report.ClinicId,
            ClinicName = report.ClinicName,
            ReportDate = report.ReportDate,
            ReportDateText = report.ReportDate.ToString("yyyy-MM-dd"),
            TotalAppointments = report.TotalAppointments,
            CompletedAppointments = report.CompletedAppointments,
            CancelledAppointments = report.CancelledAppointments,
            NoShowAppointments = report.NoShowAppointments,
            FollowUpCount = report.FollowUpCount,
            CompletedFollowUps = report.CompletedFollowUps,
            OverdueFollowUps = report.OverdueFollowUps,
            TotalRevenue = report.TotalRevenue,
            WorkloadScore = report.WorkloadScore,
            SyncSource = report.SyncSource,
            SyncedAt = report.SyncedAt,
            SyncedAtText = report.SyncedAt?.ToString("yyyy-MM-dd HH:mm"),
            CreatedAt = report.CreatedAt
        };
    }
}
