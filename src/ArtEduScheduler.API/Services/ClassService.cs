using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface IClassService
{
    Task<List<ClassDto>> GetClassesAsync(int? teacherId = null, bool activeOnly = true);
    Task<ClassDto?> GetClassByIdAsync(int id);
    Task<List<ClassDto>> GetStudentClassesAsync(int studentId);
    Task<ClassDto> CreateClassAsync(CreateClassDto dto, int operatorId);
    Task<ClassDto> UpdateClassAsync(int id, CreateClassDto dto, int operatorId);
    Task EnrollStudentAsync(int classId, int studentId, int operatorId);
    Task RemoveStudentAsync(int classId, int studentId, int operatorId);
}

public class ClassService : IClassService
{
    private readonly AppDbContext _context;
    private readonly IOperationLogService _logService;
    private readonly ICacheService _cache;

    public ClassService(AppDbContext context, IOperationLogService logService, ICacheService cache)
    {
        _context = context;
        _logService = logService;
        _cache = cache;
    }

    public async Task<List<ClassDto>> GetClassesAsync(int? teacherId = null, bool activeOnly = true)
    {
        var cacheKey = $"classes:{teacherId}:{activeOnly}";
        var cached = await _cache.GetAsync<List<ClassDto>>(cacheKey);
        if (cached != null) return cached;

        var query = _context.Classes.AsQueryable();
        if (activeOnly) query = query.Where(c => c.IsActive);
        if (teacherId.HasValue) query = query.Where(c => c.TeacherId == teacherId.Value);

        var classes = await query
            .Include(c => c.Course)
            .Include(c => c.Teacher)
            .Include(c => c.StudentClasses)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();

        var result = classes.Select(MapToDto).ToList();
        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(5));
        return result;
    }

    public async Task<ClassDto?> GetClassByIdAsync(int id)
    {
        var cls = await _context.Classes
            .Include(c => c.Course)
            .Include(c => c.Teacher)
            .Include(c => c.StudentClasses).ThenInclude(sc => sc.Student)
            .FirstOrDefaultAsync(c => c.Id == id);

        return cls == null ? null : MapToDto(cls);
    }

    public async Task<List<ClassDto>> GetStudentClassesAsync(int studentId)
    {
        var classes = await _context.StudentClasses
            .Where(sc => sc.StudentId == studentId && sc.IsActive)
            .Include(sc => sc.Class).ThenInclude(c => c.Course)
            .Include(sc => sc.Class).ThenInclude(c => c.Teacher)
            .Select(sc => sc.Class)
            .ToListAsync();

        return classes.Select(MapToDto).ToList();
    }

    public async Task<ClassDto> CreateClassAsync(CreateClassDto dto, int operatorId)
    {
        var cls = new Class
        {
            Name = dto.Name,
            Description = dto.Description,
            CourseId = dto.CourseId,
            TeacherId = dto.TeacherId,
            MaxStudents = dto.MaxStudents,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Classes.Add(cls);
        await _context.SaveChangesAsync();

        await _logService.LogAsync(OperationType.ClassAdjustment, operatorId, "Class", cls.Id,
            null, dto, $"创建班级：{dto.Name}");

        await _cache.RemoveByPrefixAsync("classes:");
        return MapToDto(cls);
    }

    public async Task<ClassDto> UpdateClassAsync(int id, CreateClassDto dto, int operatorId)
    {
        var cls = await _context.Classes.FindAsync(id) ?? throw new InvalidOperationException("班级不存在");
        var before = new { cls.Name, cls.Description, cls.TeacherId, cls.MaxStudents, cls.StartDate, cls.EndDate };

        cls.Name = dto.Name;
        cls.Description = dto.Description;
        cls.TeacherId = dto.TeacherId;
        cls.MaxStudents = dto.MaxStudents;
        cls.StartDate = dto.StartDate;
        cls.EndDate = dto.EndDate;
        cls.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        await _logService.LogAsync(OperationType.ClassAdjustment, operatorId, "Class", id,
            before, dto, $"更新班级信息：{dto.Name}");

        await _cache.RemoveByPrefixAsync("classes:");
        return MapToDto(cls);
    }

    public async Task EnrollStudentAsync(int classId, int studentId, int operatorId)
    {
        if (await _context.StudentClasses.AnyAsync(sc => sc.ClassId == classId && sc.StudentId == studentId && sc.IsActive))
            throw new InvalidOperationException("学生已在该班级中");

        var cls = await _context.Classes.Include(c => c.StudentClasses).FirstOrDefaultAsync(c => c.Id == classId)
                  ?? throw new InvalidOperationException("班级不存在");
        if (cls.StudentClasses.Count(sc => sc.IsActive) >= cls.MaxStudents)
            throw new InvalidOperationException("班级人数已满");

        var student = await _context.Students.FindAsync(studentId)
                      ?? throw new InvalidOperationException("学生不存在");

        _context.StudentClasses.Add(new StudentClass
        {
            ClassId = classId,
            StudentId = studentId,
            EnrolledAt = DateTime.UtcNow,
            IsActive = true
        });

        await _context.SaveChangesAsync();

        await _logService.LogAsync(OperationType.ClassAdjustment, operatorId, "StudentClass", null,
            null, new { classId, studentId }, $"学生 {student.RealName} 加入班级 {cls.Name}");

        await _cache.RemoveByPrefixAsync("classes:");
    }

    public async Task RemoveStudentAsync(int classId, int studentId, int operatorId)
    {
        var enrollment = await _context.StudentClasses
            .FirstOrDefaultAsync(sc => sc.ClassId == classId && sc.StudentId == studentId);
        if (enrollment == null) throw new InvalidOperationException("学生不在该班级中");

        enrollment.IsActive = false;
        await _context.SaveChangesAsync();

        await _logService.LogAsync(OperationType.ClassAdjustment, operatorId, "StudentClass", enrollment.Id,
            new { IsActive = true }, new { IsActive = false }, "学生从班级移除");

        await _cache.RemoveByPrefixAsync("classes:");
    }

    private static ClassDto MapToDto(Class cls)
    {
        return new ClassDto
        {
            Id = cls.Id,
            Name = cls.Name,
            Description = cls.Description,
            CourseId = cls.CourseId,
            CourseName = cls.Course?.Name ?? string.Empty,
            TeacherId = cls.TeacherId,
            TeacherName = cls.Teacher?.RealName,
            MaxStudents = cls.MaxStudents,
            StudentCount = cls.StudentClasses?.Count(sc => sc.IsActive) ?? 0,
            StartDate = cls.StartDate,
            EndDate = cls.EndDate,
            IsActive = cls.IsActive
        };
    }
}
