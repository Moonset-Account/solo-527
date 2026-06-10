namespace CarWash.Application.DTOs;

public class TechnicianDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<string> Specialties { get; set; } = new();
    public string Status { get; set; } = string.Empty;
    public Guid? CurrentWorkstationId { get; set; }
    public string? CurrentWorkstationName { get; set; }
    public int CapacityDay { get; set; }
    public int CapacityUsed { get; set; }
}

public class CreateTechnicianRequest
{
    public string Name { get; set; } = string.Empty;
    public List<string> Specialties { get; set; } = new();
    public int CapacityDay { get; set; } = 8;
}

public class UpdateTechnicianRequest
{
    public string? Name { get; set; }
    public List<string>? Specialties { get; set; }
    public string? Status { get; set; }
    public int? CapacityDay { get; set; }
}
