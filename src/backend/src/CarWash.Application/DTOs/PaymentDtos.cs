namespace CarWash.Application.DTOs;

public class PaymentDto
{
    public Guid Id { get; set; }
    public Guid AppointmentId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public DateTime? PaidAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePaymentRequest
{
    public Guid AppointmentId { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = string.Empty;
}

public class UpdatePaymentStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
