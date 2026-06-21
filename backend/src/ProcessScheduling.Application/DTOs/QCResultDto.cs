namespace ProcessScheduling.Application.DTOs;

public class QCResultDto
{
    public Guid Id { get; set; }
    public Guid WorkOrderId { get; set; }
    public string WorkOrderCode { get; set; } = string.Empty;
    public Guid ProcessStepInstanceId { get; set; }
    public string StepName { get; set; } = string.Empty;
    public Guid InspectorId { get; set; }
    public string InspectorName { get; set; } = string.Empty;
    public string Result { get; set; } = string.Empty;
    public int SampleSize { get; set; }
    public int PassCount { get; set; }
    public int FailCount { get; set; }
    public string? DefectDescription { get; set; }
    public string? Remarks { get; set; }
    public DateTime CreatedAt { get; set; }
}
