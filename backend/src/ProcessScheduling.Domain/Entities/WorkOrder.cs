namespace ProcessScheduling.Domain.Entities;

public class WorkOrder : BaseEntity
{
    public string Code { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string ProductCode { get; set; } = string.Empty;
    public int PlannedQuantity { get; set; }
    public int CompletedQuantity { get; set; }
    public int DefectiveQuantity { get; set; }
    public DateTime PlannedStartTime { get; set; }
    public DateTime PlannedEndTime { get; set; }
    public DateTime? ActualStartTime { get; set; }
    public DateTime? ActualEndTime { get; set; }
    public Guid? AssignedEquipmentId { get; set; }
    public Guid? AssignedShiftId { get; set; }
    public string? Remarks { get; set; }
    public Equipment? AssignedEquipment { get; set; }
    public Shift? AssignedShift { get; set; }
    public ICollection<ProcessStepInstance> ProcessStepInstances { get; set; } = new List<ProcessStepInstance>();
    public ICollection<ProductionRecord> ProductionRecords { get; set; } = new List<ProductionRecord>();
    public ICollection<WorkReport> WorkReports { get; set; } = new List<WorkReport>();
}
