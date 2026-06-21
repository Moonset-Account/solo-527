namespace ProcessScheduling.Domain.Entities;

public class Mold : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Specification { get; set; }
    public int TotalShots { get; set; }
    public int CurrentShots { get; set; }
    public int MaintenanceThreshold { get; set; }
    public string Status { get; set; } = "Available";
    public Guid? CurrentEquipmentId { get; set; }
    public Equipment? CurrentEquipment { get; set; }
    public ICollection<MoldRecord> MoldRecords { get; set; } = new List<MoldRecord>();
}
