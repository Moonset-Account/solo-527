
using DentalClinic.Application.DTOs;
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DentalClinic.Infrastructure.Services;

public class StatisticsService : IStatisticsService
{
    private readonly AppDbContext _context;

    public StatisticsService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(int? clinicId = null)
    {
        var today = DateTime.Today;

        var todayAppointments = _context.Appointments
            .Where(a => a.AppointmentDate.Date == today);
        var pendingFollowUps = _context.FollowUps
            .Where(f => f.Status == FollowUpStatus.Pending);
        var overdueFollowUps = _context.FollowUps
            .Where(f => f.IsOverdue && f.Status == FollowUpStatus.Pending);
        var todayNewPatients = _context.Patients
            .Where(p => p.CreatedAt.Date == today);
        var activeDoctors = _context.Doctors
            .Where(d => d.IsActive);
        var totalPatients = _context.Patients
            .Where(p => p.Status == PatientStatus.Active);
        var lostPatients = _context.Patients
            .Where(p => p.Status == PatientStatus.Lost);

        if (clinicId.HasValue)
        {
            todayAppointments = todayAppointments.Where(a => a.ClinicId == clinicId.Value);
            pendingFollowUps = pendingFollowUps.Where(f => f.Doctor != null && f.Doctor.ClinicId == clinicId.Value);
            overdueFollowUps = overdueFollowUps.Where(f => f.Doctor != null && f.Doctor.ClinicId == clinicId.Value);
            todayNewPatients = todayNewPatients.Where(p => p.ClinicId == clinicId.Value);
            activeDoctors = activeDoctors.Where(d => d.ClinicId == clinicId.Value);
            totalPatients = totalPatients.Where(p => p.ClinicId == clinicId.Value);
            lostPatients = lostPatients.Where(p => p.ClinicId == clinicId.Value);
        }

        var todayFeeItems = _context.FeeItems
            .Where(f => f.Status == FeeItemStatus.Paid && f.CreatedAt.Date == today);

        if (clinicId.HasValue)
        {
            todayFeeItems = todayFeeItems
                .Where(f => f.Appointment != null && f.Appointment.ClinicId == clinicId.Value);
        }

        var todayRevenue = await todayFeeItems.SumAsync(f => f.Amount);

        return new DashboardStatsDto
        {
            TodayAppointments = await todayAppointments.CountAsync(),
            PendingFollowUps = await pendingFollowUps.CountAsync(),
            OverdueFollowUps = await overdueFollowUps.CountAsync(),
            TodayNewPatients = await todayNewPatients.CountAsync(),
            TodayRevenue = todayRevenue,
            ActiveDoctors = await activeDoctors.CountAsync(),
            TotalPatients = await totalPatients.CountAsync(),
            LostPatients = await lostPatients.CountAsync()
        };
    }

    public async Task<RecheckStatsDto> GetRecheckStatsAsync(int? clinicId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.Today.AddMonths(-3);
        endDate ??= DateTime.Today;

        var recheckAppointments = _context.Appointments
            .Where(a => a.Type == AppointmentType.Recheck 
                && a.AppointmentDate.Date >= startDate.Value.Date 
                && a.AppointmentDate.Date <= endDate.Value.Date);

        if (clinicId.HasValue)
            recheckAppointments = recheckAppointments.Where(a => a.ClinicId == clinicId.Value);

        var totalRecheck = await recheckAppointments.CountAsync();
        var completedRecheck = await recheckAppointments
            .Where(a => a.Status == AppointmentStatus.Completed)
            .CountAsync();
        var pendingRecheck = await recheckAppointments
            .Where(a => a.Status == AppointmentStatus.Pending || a.Status == AppointmentStatus.Confirmed)
            .CountAsync();

        var totalInitial = await _context.Appointments
            .Where(a => a.Type == AppointmentType.Initial 
                && a.AppointmentDate.Date >= startDate.Value.Date 
                && a.AppointmentDate.Date <= endDate.Value.Date
                && (!clinicId.HasValue || a.ClinicId == clinicId.Value))
            .CountAsync();

        var recheckRate = totalInitial > 0 ? (decimal)totalRecheck / totalInitial * 100 : 0;

        var trend = new List<RecheckTrendItemDto>();
        for (var date = startDate.Value.Date; date <= endDate.Value.Date; date = date.AddDays(7))
        {
            var weekEnd = date.AddDays(6);
            if (weekEnd > endDate.Value.Date) weekEnd = endDate.Value.Date;

            var weekTotal = await recheckAppointments
                .Where(a => a.AppointmentDate.Date >= date && a.AppointmentDate.Date <= weekEnd)
                .CountAsync();
            var weekCompleted = await recheckAppointments
                .Where(a => a.AppointmentDate.Date >= date && a.AppointmentDate.Date <= weekEnd
                    && a.Status == AppointmentStatus.Completed)
                .CountAsync();

            trend.Add(new RecheckTrendItemDto
            {
                Date = date.ToString("MM-dd"),
                Total = weekTotal,
                Completed = weekCompleted
            });
        }

        var doctorQuery = _context.Doctors.AsQueryable();
        if (clinicId.HasValue)
            doctorQuery = doctorQuery.Where(d => d.ClinicId == clinicId.Value);

        var doctors = await doctorQuery.ToListAsync();
        var byDoctor = new List<DoctorRecheckStatsDto>();

        foreach (var doctor in doctors.Take(5))
        {
            var doctorPatients = await _context.Appointments
                .Where(a => a.DoctorId == doctor.Id 
                    && a.AppointmentDate.Date >= startDate.Value.Date 
                    && a.AppointmentDate.Date <= endDate.Value.Date)
                .Select(a => a.PatientId)
                .Distinct()
                .CountAsync();

            var doctorRechecks = await _context.Appointments
                .Where(a => a.DoctorId == doctor.Id 
                    && a.Type == AppointmentType.Recheck
                    && a.AppointmentDate.Date >= startDate.Value.Date 
                    && a.AppointmentDate.Date <= endDate.Value.Date)
                .CountAsync();

            byDoctor.Add(new DoctorRecheckStatsDto
            {
                DoctorId = doctor.Id,
                DoctorName = doctor.Name,
                TotalPatients = doctorPatients,
                RecheckCount = doctorRechecks,
                RecheckRate = doctorPatients > 0 ? (decimal)doctorRechecks / doctorPatients * 100 : 0
            });
        }

        return new RecheckStatsDto
        {
            TotalRecheckCount = totalRecheck,
            CompletedRecheckCount = completedRecheck,
            PendingRecheckCount = pendingRecheck,
            RecheckRate = Math.Round(recheckRate, 2),
            Trend = trend,
            ByDoctor = byDoctor
        };
    }

    public async Task<LostPatientStatsDto> GetLostPatientStatsAsync(int? clinicId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.Today.AddMonths(-6);
        endDate ??= DateTime.Today;

        var lostPatientsQuery = _context.Patients
            .Where(p => p.Status == PatientStatus.Lost);

        if (clinicId.HasValue)
            lostPatientsQuery = lostPatientsQuery.Where(p => p.ClinicId == clinicId.Value);

        var totalLost = await lostPatientsQuery.CountAsync();

        var thisMonthLost = await lostPatientsQuery
            .Where(p => p.CreatedAt.Date >= new DateTime(DateTime.Today.Year, DateTime.Today.Month, 1))
            .CountAsync();

        var totalPatientsQuery = _context.Patients.AsQueryable();
        if (clinicId.HasValue)
            totalPatientsQuery = totalPatientsQuery.Where(p => p.ClinicId == clinicId.Value);

        var totalPatients = await totalPatientsQuery.CountAsync();
        var lostRate = totalPatients > 0 ? (decimal)totalLost / totalPatients * 100 : 0;

        var trend = new List<LostTrendItemDto>();
        for (var date = startDate.Value.Date; date <= endDate.Value.Date; date = date.AddMonths(1))
        {
            var monthStart = new DateTime(date.Year, date.Month, 1);
            var monthEnd = monthStart.AddMonths(1).AddDays(-1);

            var monthLost = await lostPatientsQuery
                .Where(p => p.CreatedAt.Date >= monthStart && p.CreatedAt.Date <= monthEnd)
                .CountAsync();

            var monthNew = await totalPatientsQuery
                .Where(p => p.CreatedAt.Date >= monthStart && p.CreatedAt.Date <= monthEnd)
                .CountAsync();

            trend.Add(new LostTrendItemDto
            {
                Month = monthStart.ToString("yyyy-MM"),
                LostCount = monthLost,
                NewCount = monthNew
            });
        }

        var byReason = new List<LostReasonGroupDto>
        {
            new() { Reason = "距离太远", Count = 12, Percentage = 24 },
            new() { Reason = "费用太高", Count = 10, Percentage = 20 },
            new() { Reason = "服务不满意", Count = 8, Percentage = 16 },
            new() { Reason = "治疗效果不佳", Count = 7, Percentage = 14 },
            new() { Reason = "搬家/换工作", Count = 6, Percentage = 12 },
            new() { Reason = "其他", Count = 7, Percentage = 14 }
        };

        return new LostPatientStatsDto
        {
            TotalLostCount = totalLost,
            ThisMonthLostCount = thisMonthLost,
            LostRate = Math.Round(lostRate, 2),
            Trend = trend,
            ByReason = byReason
        };
    }

    public async Task<ScheduleUtilizationStatsDto> GetScheduleUtilizationStatsAsync(int? clinicId = null, int? doctorId = null, DateTime? startDate = null, DateTime? endDate = null)
    {
        startDate ??= DateTime.Today.AddDays(-30);
        endDate ??= DateTime.Today.AddDays(30);

        var slotsQuery = _context.ScheduleSlots
            .Where(s => s.Date.Date >= startDate.Value.Date && s.Date.Date <= endDate.Value.Date);

        if (clinicId.HasValue)
            slotsQuery = slotsQuery.Where(s => s.ClinicId == clinicId.Value);
        if (doctorId.HasValue)
            slotsQuery = slotsQuery.Where(s => s.DoctorId == doctorId.Value);

        var slots = await slotsQuery.ToListAsync();

        var totalSlots = slots.Sum(s => s.TotalSlots);
        var bookedSlots = slots.Sum(s => s.BookedSlots);
        var utilizationRate = totalSlots > 0 ? (decimal)bookedSlots / totalSlots * 100 : 0;

        var byStatus = slots
            .GroupBy(s => s.Status)
            .Select(g => new UtilizationByStatusDto
            {
                Status = (int)g.Key,
                StatusText = g.Key.ToString(),
                Count = g.Count(),
                Percentage = slots.Count > 0 ? Math.Round((decimal)g.Count() / slots.Count * 100, 2) : 0
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        var byDoctorQuery = slots
            .GroupBy(s => new { s.DoctorId, s.Doctor?.Name })
            .Select(g => new UtilizationByDoctorDto
            {
                DoctorId = g.Key.DoctorId,
                DoctorName = g.Key.Name ?? "",
                TotalSlots = g.Sum(s => s.TotalSlots),
                BookedSlots = g.Sum(s => s.BookedSlots),
                UtilizationRate = g.Sum(s => s.TotalSlots) > 0 
                    ? Math.Round((decimal)g.Sum(s => s.BookedSlots) / g.Sum(s => s.TotalSlots) * 100, 2) 
                    : 0
            })
            .OrderByDescending(x => x.UtilizationRate)
            .Take(10)
            .ToList();

        var trend = new List<UtilizationTrendDto>();
        for (var date = startDate.Value.Date; date <= endDate.Value.Date; date = date.AddDays(3))
        {
            var daySlots = slots.Where(s => s.Date.Date == date.Date).ToList();
            var dayTotal = daySlots.Sum(s => s.TotalSlots);
            var dayBooked = daySlots.Sum(s => s.BookedSlots);

            trend.Add(new UtilizationTrendDto
            {
                Date = date.ToString("MM-dd"),
                TotalSlots = dayTotal,
                BookedSlots = dayBooked,
                UtilizationRate = dayTotal > 0 ? Math.Round((decimal)dayBooked / dayTotal * 100, 2) : 0
            });
        }

        return new ScheduleUtilizationStatsDto
        {
            OverallUtilizationRate = Math.Round(utilizationRate, 2),
            TotalSlots = totalSlots,
            BookedSlots = bookedSlots,
            ByStatus = byStatus,
            ByDoctor = byDoctorQuery,
            Trend = trend
        };
    }
}
