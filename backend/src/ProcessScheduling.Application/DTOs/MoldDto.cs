namespace ProcessScheduling.Application.DTOs;

public class MoldDto
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public int TotalShots { get; set; }
    public int CurrentShots { get; set; }
    public int MaintenanceThreshold { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? CurrentEquipmentId { get; set; }
    public string? EquipmentName { get; set; }
}
