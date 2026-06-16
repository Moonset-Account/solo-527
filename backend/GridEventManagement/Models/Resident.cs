namespace GridEventManagement.Web.Models;

public class Resident
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string IdCard { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int GridId { get; set; }
    public string? HouseholdType { get; set; }
    public string? Tags { get; set; }
    public string? Remark { get; set; }

    public Grid Grid { get; set; } = null!;
}
