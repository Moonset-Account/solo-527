
namespace GridEventManagement.Web.DTOs;

public class ResidentDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IdCard { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? GridId { get; set; }
    public string? GridName { get; set; }
    public string? HouseholdType { get; set; }
    public string? Tags { get; set; }
    public string? Remark { get; set; }
}

public class CreateResidentDto
{
    public string Name { get; set; } = string.Empty;
    public string IdCard { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? GridId { get; set; }
    public string? HouseholdType { get; set; }
    public string? Tags { get; set; }
    public string? Remark { get; set; }
}

public class UpdateResidentDto
{
    public string Name { get; set; } = string.Empty;
    public string IdCard { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int? GridId { get; set; }
    public string? HouseholdType { get; set; }
    public string? Tags { get; set; }
    public string? Remark { get; set; }
}

public class ResidentQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int? GridId { get; set; }
    public string? Keyword { get; set; }
    public string? HouseholdType { get; set; }
    public string? Tag { get; set; }
}
