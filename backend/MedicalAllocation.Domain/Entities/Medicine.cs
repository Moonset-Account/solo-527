namespace MedicalAllocation.Domain.Entities;

public class Medicine
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string GenericName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string ApprovalNumber { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal SafetyStock { get; set; }
    public decimal MaxStock { get; set; }
    public decimal LeadTimeDays { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.Now;
    public DateTime? UpdatedAt { get; set; }
}
