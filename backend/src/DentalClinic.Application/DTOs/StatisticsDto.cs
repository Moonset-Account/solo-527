
namespace DentalClinic.Application.DTOs;

public class StatisticsDto
{
    public DashboardStatsDto Dashboard { get; set; } = new();
    public RecheckStatsDto Recheck { get; set; } = new();
    public LostPatientStatsDto LostPatients { get; set; } = new();
    public ScheduleUtilizationStatsDto ScheduleUtilization { get; set; } = new();
}

public class DashboardStatsDto
{
    public int TodayAppointments { get; set; }
    public int PendingFollowUps { get; set; }
    public int OverdueFollowUps { get; set; }
    public int TodayNewPatients { get; set; }
    public decimal TodayRevenue { get; set; }
    public int ActiveDoctors { get; set; }
    public int TotalPatients { get; set; }
    public int LostPatients { get; set; }
}

public class RecheckStatsDto
{
    public int TotalRecheckCount { get; set; }
    public int CompletedRecheckCount { get; set; }
    public int PendingRecheckCount { get; set; }
    public decimal RecheckRate { get; set; }
    public List<RecheckTrendItemDto> Trend { get; set; } = new();
    public List<DoctorRecheckStatsDto> ByDoctor { get; set; } = new();
}

public class RecheckTrendItemDto
{
    public string Date { get; set; } = string.Empty;
    public int Total { get; set; }
    public int Completed { get; set; }
}

public class DoctorRecheckStatsDto
{
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int TotalPatients { get; set; }
    public int RecheckCount { get; set; }
    public decimal RecheckRate { get; set; }
}

public class LostPatientStatsDto
{
    public int TotalLostCount { get; set; }
    public int ThisMonthLostCount { get; set; }
    public decimal LostRate { get; set; }
    public List<LostTrendItemDto> Trend { get; set; } = new();
    public List<LostReasonGroupDto> ByReason { get; set; } = new();
}

public class LostTrendItemDto
{
    public string Month { get; set; } = string.Empty;
    public int LostCount { get; set; }
    public int NewCount { get; set; }
}

public class LostReasonGroupDto
{
    public string Reason { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class ScheduleUtilizationStatsDto
{
    public decimal OverallUtilizationRate { get; set; }
    public int TotalSlots { get; set; }
    public int BookedSlots { get; set; }
    public List<UtilizationByStatusDto> ByStatus { get; set; } = new();
    public List<UtilizationByDoctorDto> ByDoctor { get; set; } = new();
    public List<UtilizationTrendDto> Trend { get; set; } = new();
}

public class UtilizationByStatusDto
{
    public int Status { get; set; }
    public string StatusText { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percentage { get; set; }
}

public class UtilizationByDoctorDto
{
    public int DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public int TotalSlots { get; set; }
    public int BookedSlots { get; set; }
    public decimal UtilizationRate { get; set; }
}

public class UtilizationTrendDto
{
    public string Date { get; set; } = string.Empty;
    public int TotalSlots { get; set; }
    public int BookedSlots { get; set; }
    public decimal UtilizationRate { get; set; }
}
