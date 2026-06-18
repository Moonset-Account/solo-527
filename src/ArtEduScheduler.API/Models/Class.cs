namespace ArtEduScheduler.API.Models;

public class Class
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CourseId { get; set; }
    public Course? Course { get; set; }
    public int? TeacherId { get; set; }
    public User? Teacher { get; set; }
    public int MaxStudents { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<StudentClass> StudentClasses { get; set; } = new List<StudentClass>();
    public ICollection<Schedule> Schedules { get; set; } = new List<Schedule>();
}

public class StudentClass
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public Student? Student { get; set; }
    public int ClassId { get; set; }
    public Class? Class { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
}

public class Course
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string ArtType { get; set; } = string.Empty;
    public int TotalHours { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Class> Classes { get; set; } = new List<Class>();
}
