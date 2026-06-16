
namespace DentalClinic.Application.DTOs;

public class PrescriptionDto
{
    public int Id { get; set; }
    public int PatientId { get; set; }
    public string? PatientName { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public string PrescriptionNo { get; set; } = string.Empty;
    public string? Remark { get; set; }
    public decimal TotalAmount { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<PrescriptionItemDto> Items { get; set; } = new();
}

public class PrescriptionItemDto
{
    public int Id { get; set; }
    public string MedicineName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Usage { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public string? Remark { get; set; }
}

public class PrescriptionCreateDto
{
    public int PatientId { get; set; }
    public int? AppointmentId { get; set; }
    public int DoctorId { get; set; }
    public string? Remark { get; set; }
    public List<PrescriptionItemCreateDto> Items { get; set; } = new();
}

public class PrescriptionItemCreateDto
{
    public string MedicineName { get; set; } = string.Empty;
    public string Specification { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Usage { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Remark { get; set; }
}
