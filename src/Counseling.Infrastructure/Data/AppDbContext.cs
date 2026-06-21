using Counseling.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Counseling.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Counselor> Counselors { get; set; }
    public DbSet<ServiceItem> ServiceItems { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<CheckInRecord> CheckInRecords { get; set; }
    public DbSet<NoShowRecord> NoShowRecords { get; set; }
    public DbSet<RefundRecord> RefundRecords { get; set; }
    public DbSet<WaitlistItem> WaitlistItems { get; set; }
    public DbSet<Reminder> Reminders { get; set; }
    public DbSet<StoreClosure> StoreClosures { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<User>().HasIndex(u => u.Phone).IsUnique();
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);

        modelBuilder.Entity<Counselor>().HasIndex(c => c.UserId).IsUnique();
        modelBuilder.Entity<Counselor>().HasQueryFilter(c => !c.IsDeleted);
        modelBuilder.Entity<Counselor>()
            .HasOne(c => c.User)
            .WithOne()
            .HasForeignKey<Counselor>(c => c.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ServiceItem>().HasIndex(s => s.Name).IsUnique();
        modelBuilder.Entity<ServiceItem>().HasQueryFilter(s => !s.IsDeleted);

        modelBuilder.Entity<Counselor>()
            .HasMany(c => c.ServiceItems)
            .WithMany(s => s.Counselors)
            .UsingEntity(j => j.ToTable("CounselorServiceItems"));

        modelBuilder.Entity<Appointment>().HasIndex(a => a.AppointmentNo).IsUnique();
        modelBuilder.Entity<Appointment>().HasIndex(a => new { a.CounselorId, a.AppointmentDate });
        modelBuilder.Entity<Appointment>().HasIndex(a => a.Status);
        modelBuilder.Entity<Appointment>().HasQueryFilter(a => !a.IsDeleted);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Client)
            .WithMany(u => u.Appointments)
            .HasForeignKey(a => a.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Counselor)
            .WithMany(c => c.Appointments)
            .HasForeignKey(a => a.CounselorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.ServiceItem)
            .WithMany(s => s.Appointments)
            .HasForeignKey(a => a.ServiceItemId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<CheckInRecord>().HasIndex(c => c.AppointmentId).IsUnique();
        modelBuilder.Entity<CheckInRecord>().HasIndex(c => c.CheckInTime);
        modelBuilder.Entity<CheckInRecord>().HasQueryFilter(c => !c.IsDeleted);

        modelBuilder.Entity<CheckInRecord>()
            .HasOne(c => c.Appointment)
            .WithOne(a => a.CheckInRecord)
            .HasForeignKey<CheckInRecord>(c => c.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<NoShowRecord>().HasIndex(n => n.AppointmentId).IsUnique();
        modelBuilder.Entity<NoShowRecord>().HasQueryFilter(n => !n.IsDeleted);

        modelBuilder.Entity<NoShowRecord>()
            .HasOne(n => n.Appointment)
            .WithOne(a => a.NoShowRecord)
            .HasForeignKey<NoShowRecord>(n => n.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<RefundRecord>().HasIndex(r => r.AppointmentId);
        modelBuilder.Entity<RefundRecord>().HasIndex(r => r.Status);
        modelBuilder.Entity<RefundRecord>().HasQueryFilter(r => !r.IsDeleted);

        modelBuilder.Entity<RefundRecord>()
            .HasOne(r => r.Appointment)
            .WithOne(a => a.RefundRecord)
            .HasForeignKey<RefundRecord>(r => r.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<WaitlistItem>().HasIndex(w => new { w.ServiceItemId, w.IsActive });
        modelBuilder.Entity<WaitlistItem>().HasIndex(w => new { w.PreferredDate, w.IsActive });
        modelBuilder.Entity<WaitlistItem>().HasQueryFilter(w => !w.IsDeleted);

        modelBuilder.Entity<Reminder>().HasIndex(r => new { r.UserId, r.IsRead });
        modelBuilder.Entity<Reminder>().HasIndex(r => new { r.ScheduledAt, r.IsSent });
        modelBuilder.Entity<Reminder>().HasQueryFilter(r => !r.IsDeleted);

        modelBuilder.Entity<StoreClosure>().HasIndex(s => s.ClosureDate);
        modelBuilder.Entity<StoreClosure>().HasQueryFilter(s => !s.IsDeleted);
    }
}
