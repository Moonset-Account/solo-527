using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Domain.Entities;

public class Equipment : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Stopped;
    public string? CurrentWorkOrderCode { get; set; }
    public Guid? CurrentMoldId { get; set; }
    public Guid? CurrentShiftId { get; set; }
    public string Location { get; set; } = string.Empty;
    public Mold? CurrentMold { get; set; }
    public Shift? CurrentShift { get; set; }
    public ICollection<EquipmentStatusHistory> StatusHistories { get; set; } = new List<EquipmentStatusHistory>();
    public ICollection<DowntimeRecord> DowntimeRecords { get; set; } = new List<DowntimeRecord>();
    public ICollection<ProductionRecord> ProductionRecords { get; set; } = new List<ProductionRecord>();
}
