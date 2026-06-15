using System.ComponentModel.DataAnnotations;

namespace QualityControl.API.Models;

public class Customer
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(50)]
    public string? CustomerLevel { get; set; }

    [MaxLength(200)]
    public string? CompanyName { get; set; }

    public DateTime CreatedAt { get; set; }

    public bool IsActive { get; set; } = true;

    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<ServiceRating> Ratings { get; set; } = new List<ServiceRating>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
