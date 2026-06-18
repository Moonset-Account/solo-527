using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Student> Students => Set<Student>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<Class> Classes => Set<Class>();
    public DbSet<StudentClass> StudentClasses => Set<StudentClass>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<LeaveRecord> LeaveRecords => Set<LeaveRecord>();
    public DbSet<WorkFeedback> WorkFeedbacks => Set<WorkFeedback>();
    public DbSet<HomeSchoolFeedback> HomeSchoolFeedbacks => Set<HomeSchoolFeedback>();
    public DbSet<OperationLog> OperationLogs => Set<OperationLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<HoursWarning> HoursWarnings => Set<HoursWarning>();
    public DbSet<BatchOperation> BatchOperations => Set<BatchOperation>();
    public DbSet<ReportMonthly> ReportMonthlies => Set<ReportMonthly>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasDiscriminator(u => u.Role)
            .HasValue<User>(UserRole.Admin)
            .HasValue<Student>(UserRole.Student);

        modelBuilder.Entity<User>().HasIndex(u => u.UserName).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Phone);

        modelBuilder.Entity<Class>()
            .HasOne(c => c.Teacher)
            .WithMany(u => u.TaughtClasses)
            .HasForeignKey(c => c.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StudentClass>()
            .HasOne(sc => sc.Student)
            .WithMany(s => s.StudentClasses)
            .HasForeignKey(sc => sc.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<StudentClass>()
            .HasOne(sc => sc.Class)
            .WithMany(c => c.StudentClasses)
            .HasForeignKey(sc => sc.ClassId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<StudentClass>()
            .HasIndex(sc => new { sc.StudentId, sc.ClassId }).IsUnique();

        modelBuilder.Entity<Schedule>()
            .HasOne(s => s.OriginalSchedule)
            .WithMany()
            .HasForeignKey(s => s.OriginalScheduleId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Attendance>()
            .HasIndex(a => new { a.ScheduleId, a.StudentId }).IsUnique();

        modelBuilder.Entity<OperationLog>().HasIndex(o => o.CreatedAt);
        modelBuilder.Entity<OperationLog>().HasIndex(o => o.OperationType);
        modelBuilder.Entity<OperationLog>().HasIndex(o => new { o.EntityType, o.EntityId });

        modelBuilder.Entity<Notification>().HasIndex(n => n.ToUserId);
        modelBuilder.Entity<Notification>().HasIndex(n => n.IsRead);

        modelBuilder.Entity<HoursWarning>().HasIndex(h => h.StudentId);
        modelBuilder.Entity<HoursWarning>().HasIndex(h => h.NotifiedAdvisor);

        modelBuilder.Entity<BatchOperation>().HasIndex(b => b.CreatedAt);
        modelBuilder.Entity<BatchOperation>().HasIndex(b => b.OperatorId);

        modelBuilder.Entity<ReportMonthly>()
            .HasIndex(r => new { r.Year, r.Month, r.StudentId }).IsUnique();

        modelBuilder.Entity<HomeSchoolFeedback>().HasIndex(h => h.StudentId);
        modelBuilder.Entity<HomeSchoolFeedback>().HasIndex(h => h.CreatedAt);
        modelBuilder.Entity<HomeSchoolFeedback>().HasIndex(h => h.IsReminder);

        modelBuilder.Entity<LeaveRecord>().HasIndex(l => l.StudentId);
        modelBuilder.Entity<LeaveRecord>().HasIndex(l => l.Status);

        modelBuilder.Entity<WorkFeedback>().HasIndex(w => w.StudentId);
        modelBuilder.Entity<WorkFeedback>().HasIndex(w => w.ParentNotified);
    }
}
