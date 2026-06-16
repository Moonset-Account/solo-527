
namespace DentalClinic.Application.DTOs;

public class PatientDto
{
    public int Id { get; set; }
    public int ClinicId { get; set; }
    public string? ClinicName { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public int? Age { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? IdCard { get; set; }
    public string? Address { get; set; }
    public string? Remark { get; set; }
    public int Status { get; set; }
    public string? StatusText { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class PatientCreateDto
{
    public int ClinicId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? IdCard { get; set; }
    public string? Address { get; set; }
    public string? Remark { get; set; }
}

public class PatientUpdateDto
{
    public string Name { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public DateTime? BirthDate { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? IdCard { get; set; }
    public string? Address { get; set; }
    public string? Remark { get; set; }
    public int Status { get; set; }
}

public class PatientQueryDto : PagedQueryDto
{
    public int? ClinicId { get; set; }
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public int? Status { get; set; }
}
