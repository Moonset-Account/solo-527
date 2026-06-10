namespace CarWash.Application.DTOs;

public class VehicleDto
{
    public Guid Id { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Vin { get; set; }
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public List<string> Tags { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class VehicleServiceRecordDto
{
    public Guid Id { get; set; }
    public Guid VehicleId { get; set; }
    public Guid AppointmentId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public string TechnicianName { get; set; } = string.Empty;
    public DateTime CompletedAt { get; set; }
    public string? Notes { get; set; }
}

public class CreateVehicleRequest
{
    public string PlateNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Vin { get; set; }
    public Guid CustomerId { get; set; }
    public string? Notes { get; set; }
    public List<string> Tags { get; set; } = new();
}

public class UpdateVehicleRequest
{
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public string? Color { get; set; }
    public string? Vin { get; set; }
    public string? Notes { get; set; }
    public List<string>? Tags { get; set; }
}
