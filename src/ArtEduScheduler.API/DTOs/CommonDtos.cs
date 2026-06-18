using ArtEduScheduler.API.Models;

namespace ArtEduScheduler.API.DTOs;

public class LoginDto
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class LoginResponseDto
{
    public string Token { get; set; } = string.Empty;
    public UserDto User { get; set; } = new();
}

public class UserDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? RemainingHours { get; set; }
    public int? TotalHours { get; set; }
    public string? ArtMajor { get; set; }
    public string? ParentName { get; set; }
    public string? ParentPhone { get; set; }
}

public class CreateUserDto
{
    public string UserName { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public int? TotalHours { get; set; }
    public string? ArtMajor { get; set; }
    public string? ParentName { get; set; }
    public string? ParentPhone { get; set; }
}

public class ClassDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CourseId { get; set; }
    public string CourseName { get; set; } = string.Empty;
    public int? TeacherId { get; set; }
    public string? TeacherName { get; set; }
    public int MaxStudents { get; set; }
    public int StudentCount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; }
}

public class CreateClassDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CourseId { get; set; }
    public int? TeacherId { get; set; }
    public int MaxStudents { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
}

public class ScheduleDto
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string? TeacherName { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Classroom { get; set; }
    public ScheduleStatus Status { get; set; }
    public int DurationHours { get; set; }
    public string? Notes { get; set; }
}

public class CreateScheduleDto
{
    public int ClassId { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string? Classroom { get; set; }
    public int DurationHours { get; set; }
    public string? Notes { get; set; }
}

public class RescheduleDto
{
    public int ScheduleId { get; set; }
    public DateTime NewStartTime { get; set; }
    public DateTime NewEndTime { get; set; }
    public string? Classroom { get; set; }
    public string Reason { get; set; } = string.Empty;
}
