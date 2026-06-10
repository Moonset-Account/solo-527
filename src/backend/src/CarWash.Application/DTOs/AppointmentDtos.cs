namespace CarWash.Application.DTOs;

public class AppointmentDto
{
    public Guid Id { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public Guid ServicePackageId { get; set; }
    public string ServicePackageName { get; set; } = string.Empty;
    public decimal ServicePackagePrice { get; set; }
    public DateTime AppointmentTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid? TechnicianId { get; set; }
    public string? TechnicianName { get; set; }
    public Guid? WorkstationId { get; set; }
    public string? WorkstationName { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAppointmentRequest
{
    public Guid CustomerId { get; set; }
    public Guid ServicePackageId { get; set; }
    public DateTime AppointmentTime { get; set; }
    public string? Notes { get; set; }
}

public class UpdateAppointmentRequest
{
    public Guid? TechnicianId { get; set; }
    public Guid? WorkstationId { get; set; }
    public string? Status { get; set; }
    public string? Notes { get; set; }
}

public class AppointmentResponse
{
    public AppointmentDto Appointment { get; set; } = null!;
    public string PaymentUrl { get; set; } = string.Empty;
}

public class AppointmentListRequest
{
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
    public Guid? CustomerId { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
