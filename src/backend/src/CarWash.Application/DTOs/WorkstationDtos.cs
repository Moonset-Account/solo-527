namespace CarWash.Application.DTOs;

public class WorkstationDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public Guid? CurrentAppointmentId { get; set; }
    public Guid? CurrentTechnicianId { get; set; }
    public string? CurrentTechnicianName { get; set; }
}

public class CreateWorkstationRequest
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
}

public class UpdateWorkstationRequest
{
    public string? Name { get; set; }
    public string? Type { get; set; }
    public string? Status { get; set; }
}
