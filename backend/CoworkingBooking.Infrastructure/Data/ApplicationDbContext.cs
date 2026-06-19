using CoworkingBooking.Domain.Entities;
using CoworkingBooking.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace CoworkingBooking.Infrastructure.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<CoworkingSpace> CoworkingSpaces => Set<CoworkingSpace>();
    public DbSet<SpacePrice> SpacePrices => Set<SpacePrice>();
    public DbSet<ViewingAppointment> ViewingAppointments => Set<ViewingAppointment>();
    public DbSet<FollowUpRecord> FollowUpRecords => Set<FollowUpRecord>();
    public DbSet<NoShowRecord> NoShowRecords => Set<NoShowRecord>();
    public DbSet<LeaseContract> LeaseContracts => Set<LeaseContract>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<Domain.Entities.Order> Orders => Set<Domain.Entities.Order>();
    public DbSet<OrderFulfillment> OrderFulfillments => Set<OrderFulfillment>();
    public DbSet<OperationLog> OperationLogs => Set<OperationLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<CoworkingSpace>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<SpacePrice>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ViewingAppointment>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<FollowUpRecord>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<NoShowRecord>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<LeaseContract>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Bill>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Domain.Entities.Order>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<OrderFulfillment>().HasQueryFilter(e => !e.IsDeleted);

        builder.Entity<CoworkingSpace>()
            .HasIndex(s => s.Code)
            .IsUnique();

        builder.Entity<ViewingAppointment>()
            .HasIndex(a => a.AppointmentNo)
            .IsUnique();

        builder.Entity<LeaseContract>()
            .HasIndex(c => c.ContractNo)
            .IsUnique();

        builder.Entity<Bill>()
            .HasIndex(b => b.BillNo)
            .IsUnique();

        builder.Entity<Domain.Entities.Order>()
            .HasIndex(o => o.OrderNo)
            .IsUnique();

        builder.Entity<ViewingAppointment>()
            .HasOne(a => a.Space)
            .WithMany(s => s.Appointments)
            .HasForeignKey(a => a.SpaceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ViewingAppointment>()
            .HasOne(a => a.Consultant)
            .WithMany(u => u.AppointmentsAsConsultant)
            .HasForeignKey(a => a.ConsultantId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<FollowUpRecord>()
            .HasOne(f => f.Appointment)
            .WithMany(a => a.FollowUpRecords)
            .HasForeignKey(f => f.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<FollowUpRecord>()
            .HasOne(f => f.Consultant)
            .WithMany(u => u.FollowUpRecords)
            .HasForeignKey(f => f.ConsultantId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<NoShowRecord>()
            .HasOne(n => n.Appointment)
            .WithOne(a => a.NoShowRecord)
            .HasForeignKey<NoShowRecord>(n => n.AppointmentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<LeaseContract>()
            .HasOne(c => c.Space)
            .WithMany(s => s.Contracts)
            .HasForeignKey(c => c.SpaceId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Bill>()
            .HasOne(b => b.Contract)
            .WithMany(c => c.Bills)
            .HasForeignKey(b => b.ContractId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Domain.Entities.Order>()
            .HasOne(o => o.Contract)
            .WithMany(c => c.Orders)
            .HasForeignKey(o => o.ContractId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<OrderFulfillment>()
            .HasOne(f => f.Order)
            .WithMany(o => o.Fulfillments)
            .HasForeignKey(f => f.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<SpacePrice>()
            .HasOne(p => p.Space)
            .WithMany(s => s.Prices)
            .HasForeignKey(p => p.SpaceId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries<EntityBase>();
        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
