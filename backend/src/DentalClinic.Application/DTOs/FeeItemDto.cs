
namespace DentalClinic.Application.DTOs;

public class FeeItemDto
{
    public int Id { get; set; }
    public int? AppointmentId { get; set; }
    public int? PrescriptionId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public int Category { get; set; }
    public string? CategoryText { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal Amount { get; set; }
    public string? Remark { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class FeeItemCreateDto
{
    public int? AppointmentId { get; set; }
    public int? PrescriptionId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemCode { get; set; } = string.Empty;
    public int Category { get; set; }
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public string? Remark { get; set; }
}

public class FeeItemUpdateDto
{
    public int Status { get; set; }
    public string? Remark { get; set; }
}
