namespace ProcessScheduling.Domain.Enums;

public enum DowntimeReason
{
    PlannedMaintenance = 1,
    MoldChange = 2,
    MaterialShortage = 3,
    EquipmentFailure = 4,
    QualityIssue = 5,
    ScheduledBreak = 6,
    Other = 99
}
