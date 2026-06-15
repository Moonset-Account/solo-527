
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Domain.Entities;

namespace PrintingFactory.Infrastructure.Data;

public class PrintingFactoryDbContext : DbContext
{
    public PrintingFactoryDbContext(DbContextOptions<PrintingFactoryDbContext> options)
        : base(options)
    {
    }

    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<ProductionNode> ProductionNodes => Set<ProductionNode>();
    public DbSet<ProductionProgress> ProductionProgresses => Set<ProductionProgress>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<EquipmentAssignment> EquipmentAssignments => Set<EquipmentAssignment>();
    public DbSet<QualityInspection> QualityInspections => Set<QualityInspection>();
    public DbSet<QualityIssue> QualityIssues => Set<QualityIssue>();
    public DbSet<DeliveryTracking> DeliveryTrackings => Set<DeliveryTracking>();
    public DbSet<BatchOperation> BatchOperations => Set<BatchOperation>();
    public DbSet<BatchOperationItem> BatchOperationItems => Set<BatchOperationItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Store>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ContactPerson).HasMaxLength(50);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Address).HasMaxLength(200);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OrderNo).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.CustomerPhone).HasMaxLength(20);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Specifications).HasMaxLength(500);
            entity.Property(e => e.Unit).HasMaxLength(20);
            entity.Property(e => e.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).IsRequired();
            entity.HasOne(e => e.Store)
                  .WithMany(s => s.Orders)
                  .HasForeignKey(e => e.StoreId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(e => e.OrderNo).IsUnique();
        });

        modelBuilder.Entity<ProductionNode>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        modelBuilder.Entity<ProductionProgress>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Operator).HasMaxLength(50);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.HasOne(e => e.Order)
                  .WithMany(o => o.ProductionProgresses)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ProductionNode)
                  .WithMany(p => p.ProductionProgresses)
                  .HasForeignKey(e => e.ProductionNodeId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Equipment)
                  .WithMany()
                  .HasForeignKey(e => e.EquipmentId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Code).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Type).HasMaxLength(50);
            entity.Property(e => e.Location).HasMaxLength(100);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.HasIndex(e => e.Code).IsUnique();
        });

        modelBuilder.Entity<EquipmentAssignment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Operator).HasMaxLength(50);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.HasOne(e => e.Order)
                  .WithMany(o => o.EquipmentAssignments)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Equipment)
                  .WithMany(e => e.EquipmentAssignments)
                  .HasForeignKey(e => e.EquipmentId)
                  .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ProductionNode)
                  .WithMany()
                  .HasForeignKey(e => e.ProductionNodeId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<QualityInspection>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Inspector).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Result).IsRequired();
            entity.Property(e => e.CheckItems).HasMaxLength(1000);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.HasOne(e => e.Order)
                  .WithMany(o => o.QualityInspections)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<QualityIssue>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AffectedScope).IsRequired().HasMaxLength(500);
            entity.Property(e => e.IssueDescription).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.RootCause).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.HandlingPath).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.CorrectiveAction).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.PreventiveAction).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.ReviewNotes).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.Handler).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Reviewer).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired();
            entity.HasOne(e => e.QualityInspection)
                  .WithOne(q => q.QualityIssue)
                  .HasForeignKey<QualityIssue>(e => e.QualityInspectionId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeliveryTracking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.DeliveryMethod).HasMaxLength(50);
            entity.Property(e => e.TrackingNo).HasMaxLength(100);
            entity.Property(e => e.Receiver).HasMaxLength(50);
            entity.Property(e => e.ReceiverPhone).HasMaxLength(20);
            entity.Property(e => e.DeliveryAddress).HasMaxLength(200);
            entity.Property(e => e.Signature).HasMaxLength(50);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.HasOne(e => e.Order)
                  .WithMany(o => o.DeliveryTrackings)
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<BatchOperation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OperationName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Operator).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).IsRequired();
            entity.Property(e => e.Remarks).HasMaxLength(500);
        });

        modelBuilder.Entity<BatchOperationItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ErrorMessage).HasMaxLength(1000);
            entity.Property(e => e.Status).IsRequired();
            entity.HasOne(e => e.BatchOperation)
                  .WithMany(b => b.Items)
                  .HasForeignKey(e => e.BatchOperationId)
                  .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Order)
                  .WithMany()
                  .HasForeignKey(e => e.OrderId)
                  .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
