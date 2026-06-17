using Microsoft.EntityFrameworkCore;
using OpsWorkOrder.Models;

namespace OpsWorkOrder.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Alert> Alerts { get; set; }
    public DbSet<AlertProcessLog> AlertProcessLogs { get; set; }
    public DbSet<AlertAttachment> AlertAttachments { get; set; }
    public DbSet<Asset> Assets { get; set; }
    public DbSet<BatchTask> BatchTasks { get; set; }
    public DbSet<BatchTaskItem> BatchTaskItems { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Vulnerability> Vulnerabilities { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.UserName).IsUnique();
            entity.Property(u => u.UserName).HasMaxLength(50).IsRequired();
            entity.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();
            entity.Property(u => u.FullName).HasMaxLength(100).IsRequired();
            entity.Property(u => u.Email).HasMaxLength(100);
            entity.Property(u => u.Phone).HasMaxLength(20);
        });

        modelBuilder.Entity<Alert>(entity =>
        {
            entity.Property(a => a.Title).HasMaxLength(200).IsRequired();
            entity.Property(a => a.Description).HasMaxLength(2000);
            entity.Property(a => a.RollbackPlan).HasMaxLength(2000);
            entity.HasOne(a => a.AssignedTo)
                  .WithMany(u => u.AssignedAlerts)
                  .HasForeignKey(a => a.AssignedToId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.CreatedBy)
                  .WithMany(u => u.CreatedAlerts)
                  .HasForeignKey(a => a.CreatedById)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(a => a.Asset)
                  .WithMany(a => a.Alerts)
                  .HasForeignKey(a => a.AssetId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AlertProcessLog>(entity =>
        {
            entity.Property(l => l.ActionDescription).HasMaxLength(500).IsRequired();
            entity.Property(l => l.Remark).HasMaxLength(2000);
            entity.HasOne(l => l.Alert)
                  .WithMany(a => a.ProcessLogs)
                  .HasForeignKey(l => l.AlertId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(l => l.Operator)
                  .WithMany(u => u.ProcessLogs)
                  .HasForeignKey(l => l.OperatorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Asset>(entity =>
        {
            entity.HasIndex(a => a.AssetCode).IsUnique();
            entity.Property(a => a.AssetCode).HasMaxLength(50).IsRequired();
            entity.Property(a => a.Name).HasMaxLength(200).IsRequired();
            entity.Property(a => a.IpAddress).HasMaxLength(100);
            entity.Property(a => a.Location).HasMaxLength(200);
            entity.Property(a => a.Description).HasMaxLength(1000);
            entity.Property(a => a.Configuration).HasColumnType("nvarchar(max)");
            entity.HasOne(a => a.Responsible)
                  .WithMany()
                  .HasForeignKey(a => a.ResponsibleId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<BatchTask>(entity =>
        {
            entity.Property(t => t.TaskName).HasMaxLength(200).IsRequired();
            entity.Property(t => t.Parameters).HasColumnType("nvarchar(max)");
            entity.Property(t => t.ResultSummary).HasMaxLength(1000);
            entity.HasOne(t => t.Creator)
                  .WithMany()
                  .HasForeignKey(t => t.CreatorId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<BatchTaskItem>(entity =>
        {
            entity.Property(i => i.ItemKey).HasMaxLength(200).IsRequired();
            entity.Property(i => i.ItemData).HasColumnType("nvarchar(max)");
            entity.Property(i => i.ErrorMessage).HasMaxLength(2000);
            entity.Property(i => i.ResultData).HasColumnType("nvarchar(max)");
            entity.HasOne(i => i.BatchTask)
                  .WithMany(t => t.Items)
                  .HasForeignKey(i => i.BatchTaskId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(n => n.Title).HasMaxLength(200).IsRequired();
            entity.Property(n => n.Content).HasMaxLength(2000).IsRequired();
            entity.Property(n => n.RelatedId).HasMaxLength(100);
            entity.Property(n => n.RelatedType).HasMaxLength(50);
            entity.HasOne(n => n.User)
                  .WithMany()
                  .HasForeignKey(n => n.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(l => l.UserName).HasMaxLength(50).IsRequired();
            entity.Property(l => l.EntityType).HasMaxLength(50).IsRequired();
            entity.Property(l => l.EntityId).HasMaxLength(100);
            entity.Property(l => l.IpAddress).HasMaxLength(50).IsRequired();
            entity.Property(l => l.Remark).HasMaxLength(1000);
            entity.Property(l => l.OldValue).HasColumnType("nvarchar(max)");
            entity.Property(l => l.NewValue).HasColumnType("nvarchar(max)");
        });

        modelBuilder.Entity<Vulnerability>(entity =>
        {
            entity.Property(v => v.Name).HasMaxLength(200).IsRequired();
            entity.Property(v => v.CveId).HasMaxLength(50);
            entity.Property(v => v.Description).HasMaxLength(2000);
            entity.Property(v => v.RemediationPlan).HasMaxLength(2000);
            entity.HasOne(v => v.Asset)
                  .WithMany()
                  .HasForeignKey(v => v.AssetId)
                  .OnDelete(DeleteBehavior.SetNull);
        });
    }
}
