
namespace DentalClinic.Application.DTOs;

public class DoctorDto
{
    public int Id { get; set; }
    public int ClinicId { get; set; }
    public string? ClinicName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Introduction { get; set; }
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DoctorCreateDto
{
    public int ClinicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Introduction { get; set; }
    public string Phone { get; set; } = string.Empty;
}

public class DoctorUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public string? Introduction { get; set; }
    public string Phone { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class DoctorQueryDto : PagedQueryDto
{
    public int? ClinicId { get; set; }
    public string? Name { get; set; }
    public string? Department { get; set; }
    public bool? IsActive { get; set; }
}
