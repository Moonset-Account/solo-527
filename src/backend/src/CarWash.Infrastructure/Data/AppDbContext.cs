using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Customer> Customers { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<ServicePackage> ServicePackages { get; set; }
    public DbSet<MemberPackage> MemberPackages { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<Technician> Technicians { get; set; }
    public DbSet<Workstation> Workstations { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<CashierOrder> CashierOrders { get; set; }
    public DbSet<CashierOrderItem> CashierOrderItems { get; set; }
    public DbSet<VehicleServiceRecord> VehicleServiceRecords { get; set; }
    public DbSet<PartsShortage> PartsShortages { get; set; }
    public DbSet<PartsShortageNode> PartsShortageNodes { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
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
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            if (entry.State == EntityState.Added)
            {
                entry.Entity.CreatedAt = DateTime.UtcNow;
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
            else if (entry.State == EntityState.Modified)
            {
                entry.Entity.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
