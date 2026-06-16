
using Microsoft.EntityFrameworkCore;
using GridEventManagement.Web.Models;

namespace GridEventManagement.Web.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Grid> Grids { get; set; }
    public DbSet<Resident> Residents { get; set; }
    public DbSet<GridEvent> GridEvents { get; set; }
    public DbSet<EventStatusLog> EventStatusLogs { get; set; }
    public DbSet<PatrolTask> PatrolTasks { get; set; }
    public DbSet<RectificationReview> RectificationReviews { get; set; }
    public DbSet<FollowUpVisit> FollowUpVisits { get; set; }
    public DbSet<TodoItem> TodoItems { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Username).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(500);
            entity.Property(e => e.RealName).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.HasOne(e => e.Grid)
                  .WithMany(g => g.Users)
                  .HasForeignKey(e => e.GridId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Grid>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.Boundary).HasMaxLength(2000);
        });

        modelBuilder.Entity<Resident>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.IdCard).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(500);
            entity.Property(e => e.HouseholdType).HasMaxLength(100);
            entity.Property(e => e.Tags).HasMaxLength(500);
            entity.Property(e => e.Remark).HasMaxLength(1000);
            entity.HasOne(e => e.Grid)
                  .WithMany(g => g.Residents)
                  .HasForeignKey(e => e.GridId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<GridEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.LocationAddress).HasMaxLength(500);
            entity.Property(e => e.SourceBillNo).HasMaxLength(100);
            entity.Property(e => e.CloseReason).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasOne(e => e.Grid)
                  .WithMany(g => g.Events)
                  .HasForeignKey(e => e.GridId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Reporter)
                  .WithMany(u => u.ReportedEvents)
                  .HasForeignKey(e => e.ReporterId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<EventStatusLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Remark).HasMaxLength(1000);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasOne(e => e.Event)
                  .WithMany(ev => ev.StatusLogs)
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Operator)
                  .WithMany(u => u.StatusLogs)
                  .HasForeignKey(e => e.OperatorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PatrolTask>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Remark).HasMaxLength(1000);
            entity.Property(e => e.SourceBillNo).HasMaxLength(100);
            entity.Property(e => e.PlanDate).IsRequired();
            entity.HasOne(e => e.Grid)
                  .WithMany(g => g.PatrolTasks)
                  .HasForeignKey(e => e.GridId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Assignee)
                  .WithMany(u => u.AssignedPatrolTasks)
                  .HasForeignKey(e => e.AssigneeId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.RelatedEvent)
                  .WithMany(ev => ev.RelatedPatrolTasks)
                  .HasForeignKey(e => e.RelatedEventId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RectificationReview>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Result).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Remark).HasMaxLength(1000);
            entity.Property(e => e.SourceBillNo).HasMaxLength(100);
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasOne(e => e.Event)
                  .WithMany(ev => ev.Reviews)
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Reviewer)
                  .WithMany(u => u.Reviews)
                  .HasForeignKey(e => e.ReviewerId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<FollowUpVisit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VisitResult).HasMaxLength(1000);
            entity.Property(e => e.VisitorRemark).HasMaxLength(1000);
            entity.Property(e => e.VisitDate).IsRequired();
            entity.Property(e => e.CreatedAt).IsRequired();
            entity.HasOne(e => e.Event)
                  .WithMany(ev => ev.Visits)
                  .HasForeignKey(e => e.EventId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Visitor)
                  .WithMany(u => u.Visits)
                  .HasForeignKey(e => e.VisitorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TodoItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.TodoItems)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
