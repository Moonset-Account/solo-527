namespace ArtEduScheduler.API.Models;

public enum UserRole
{
    Student = 1,
    Teacher = 2,
    Admin = 3,
    Principal = 4,
    AdmissionAdvisor = 5
}

public class User
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
    public ICollection<Class> TaughtClasses { get; set; } = new List<Class>();
}

public class Student : User
{
    public DateTime? BirthDate { get; set; }
    public string? ParentName { get; set; }
    public string? ParentPhone { get; set; }
    public int TotalHours { get; set; }
    public int UsedHours { get; set; }
    public int RemainingHours => TotalHours - UsedHours;
    public string? ArtMajor { get; set; }
    public string? GradeLevel { get; set; }
}
