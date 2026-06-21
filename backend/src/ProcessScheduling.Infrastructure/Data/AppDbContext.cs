using Microsoft.EntityFrameworkCore;
using ProcessScheduling.Domain.Entities;

namespace ProcessScheduling.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Shift> Shifts { get; set; }
    public DbSet<ShiftPerformance> ShiftPerformances { get; set; }
    public DbSet<Equipment> Equipments { get; set; }
    public DbSet<EquipmentStatusHistory> EquipmentStatusHistories { get; set; }
    public DbSet<Mold> Molds { get; set; }
    public DbSet<MoldRecord> MoldRecords { get; set; }
    public DbSet<WorkOrder> WorkOrders { get; set; }
    public DbSet<ProcessStepTemplate> ProcessStepTemplates { get; set; }
    public DbSet<ProcessStepInstance> ProcessStepInstances { get; set; }
    public DbSet<ProcessStepStatusChange> ProcessStepStatusChanges { get; set; }
    public DbSet<ProductionRecord> ProductionRecords { get; set; }
    public DbSet<DowntimeRecord> DowntimeRecords { get; set; }
    public DbSet<AnomalyReport> AnomalyReports { get; set; }
    public DbSet<WorkReport> WorkReports { get; set; }
    public DbSet<WorkReportAudit> WorkReportAudits { get; set; }
    public DbSet<QCResult> QCResults { get; set; }
    public DbSet<QCResultHistory> QCResultHistories { get; set; }
    public DbSet<AdjustmentRecord> AdjustmentRecords { get; set; }
    public DbSet<OperationLog> OperationLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<BaseEntity>()
            .HasQueryFilter(e => !e.IsDeleted);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(e => e.Username).IsUnique();
            entity.Property(e => e.Username).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PasswordHash).HasMaxLength(256).IsRequired();
            entity.Property(e => e.RealName).HasMaxLength(50).IsRequired();
            entity.HasOne(e => e.Shift)
                .WithMany(s => s.Members)
                .HasForeignKey(e => e.ShiftId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.Property(e => e.Name).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Leader).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<ShiftPerformance>(entity =>
        {
            entity.HasOne(e => e.Shift)
                .WithMany(s => s.Performances)
                .HasForeignKey(e => e.ShiftId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.ShiftId, e.Date }).IsUnique();
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Model).HasMaxLength(100);
            entity.Property(e => e.Location).HasMaxLength(100);
            entity.HasOne(e => e.CurrentMold)
                .WithMany()
                .HasForeignKey(e => e.CurrentMoldId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.CurrentShift)
                .WithMany()
                .HasForeignKey(e => e.CurrentShiftId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<EquipmentStatusHistory>(entity =>
        {
            entity.HasOne(e => e.Equipment)
                .WithMany(eq => eq.StatusHistories)
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Reason).HasMaxLength(500);
        });

        modelBuilder.Entity<Mold>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Specification).HasMaxLength(200);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.HasOne(e => e.CurrentEquipment)
                .WithMany()
                .HasForeignKey(e => e.CurrentEquipmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<MoldRecord>(entity =>
        {
            entity.HasOne(e => e.Mold)
                .WithMany(m => m.MoldRecords)
                .HasForeignKey(e => e.MoldId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Equipment)
                .WithMany()
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.RecordType).HasMaxLength(50);
            entity.Property(e => e.PreviousValue).HasMaxLength(500);
            entity.Property(e => e.NewValue).HasMaxLength(500);
            entity.Property(e => e.Description).HasMaxLength(1000);
        });

        modelBuilder.Entity<WorkOrder>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.ProductName).HasMaxLength(100).IsRequired();
            entity.Property(e => e.ProductCode).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Remarks).HasMaxLength(1000);
            entity.HasOne(e => e.AssignedEquipment)
                .WithMany()
                .HasForeignKey(e => e.AssignedEquipmentId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.AssignedShift)
                .WithMany()
                .HasForeignKey(e => e.AssignedShiftId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProcessStepTemplate>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.Code).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(500);
        });

        modelBuilder.Entity<ProcessStepInstance>(entity =>
        {
            entity.HasIndex(e => e.QrCode).IsUnique();
            entity.Property(e => e.QrCode).HasMaxLength(100).IsRequired();
            entity.Property(e => e.AbnormalReason).HasMaxLength(500);
            entity.HasOne(e => e.WorkOrder)
                .WithMany(w => w.ProcessStepInstances)
                .HasForeignKey(e => e.WorkOrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.ProcessStepTemplate)
                .WithMany()
                .HasForeignKey(e => e.ProcessStepTemplateId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Equipment)
                .WithMany()
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Operator)
                .WithMany()
                .HasForeignKey(e => e.OperatorId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.HasOne(e => e.Shift)
                .WithMany()
                .HasForeignKey(e => e.ShiftId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProcessStepStatusChange>(entity =>
        {
            entity.HasOne(e => e.ProcessStepInstance)
                .WithMany(p => p.StatusChanges)
                .HasForeignKey(e => e.ProcessStepInstanceId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.Reason).HasMaxLength(500);
        });

        modelBuilder.Entity<ProductionRecord>(entity =>
        {
            entity.HasOne(e => e.WorkOrder)
                .WithMany(w => w.ProductionRecords)
                .HasForeignKey(e => e.WorkOrderId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Equipment)
                .WithMany(eq => eq.ProductionRecords)
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Operator)
                .WithMany()
                .HasForeignKey(e => e.OperatorId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Shift)
                .WithMany()
                .HasForeignKey(e => e.ShiftId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Remarks).HasMaxLength(500);
        });

        modelBuilder.Entity<DowntimeRecord>(entity =>
        {
            entity.HasOne(e => e.Equipment)
                .WithMany(eq => eq.DowntimeRecords)
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Reporter)
                .WithMany()
                .HasForeignKey(e => e.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Shift)
                .WithMany()
                .HasForeignKey(e => e.ShiftId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.ReasonDetail).HasMaxLength(500);
        });

        modelBuilder.Entity<AnomalyReport>(entity =>
        {
            entity.HasOne(e => e.Equipment)
                .WithMany()
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Reporter)
                .WithMany()
                .HasForeignKey(e => e.ReporterId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Shift)
                .WithMany()
                .HasForeignKey(e => e.ShiftId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.AnomalyType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Description).HasMaxLength(1000).IsRequired();
            entity.Property(e => e.Severity).HasMaxLength(20);
            entity.Property(e => e.Status).HasMaxLength(20);
            entity.Property(e => e.Resolution).HasMaxLength(1000);
        });

        modelBuilder.Entity<WorkReport>(entity =>
        {
            entity.HasOne(e => e.WorkOrder)
                .WithMany(w => w.WorkReports)
                .HasForeignKey(e => e.WorkOrderId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Operator)
                .WithMany()
                .HasForeignKey(e => e.OperatorId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Equipment)
                .WithMany()
                .HasForeignKey(e => e.EquipmentId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Shift)
                .WithMany()
                .HasForeignKey(e => e.ShiftId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Reviewer)
                .WithMany()
                .HasForeignKey(e => e.ReviewerId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.Remarks).HasMaxLength(500);
            entity.Property(e => e.ReviewComment).HasMaxLength(500);
        });

        modelBuilder.Entity<WorkReportAudit>(entity =>
        {
            entity.HasOne(e => e.WorkReport)
                .WithMany(w => w.Audits)
                .HasForeignKey(e => e.WorkReportId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Reviewer)
                .WithMany()
                .HasForeignKey(e => e.ReviewerId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Comment).HasMaxLength(500);
        });

        modelBuilder.Entity<QCResult>(entity =>
        {
            entity.HasOne(e => e.WorkOrder)
                .WithMany()
                .HasForeignKey(e => e.WorkOrderId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.ProcessStepInstance)
                .WithMany()
                .HasForeignKey(e => e.ProcessStepInstanceId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(e => e.Inspector)
                .WithMany()
                .HasForeignKey(e => e.InspectorId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.Result).HasMaxLength(20).IsRequired();
            entity.Property(e => e.DefectDescription).HasMaxLength(1000);
            entity.Property(e => e.Remarks).HasMaxLength(500);
        });

        modelBuilder.Entity<QCResultHistory>(entity =>
        {
            entity.HasOne(e => e.QCResult)
                .WithMany(q => q.Histories)
                .HasForeignKey(e => e.QCResultId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.Property(e => e.ChangeReason).HasMaxLength(500);
        });

        modelBuilder.Entity<AdjustmentRecord>(entity =>
        {
            entity.HasIndex(e => new { e.EntityType, e.EntityId, e.FieldName });
            entity.HasOne(e => e.Operator)
                .WithMany()
                .HasForeignKey(e => e.OperatorId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.Property(e => e.EntityType).HasMaxLength(50).IsRequired();
            entity.Property(e => e.FieldName).HasMaxLength(50).IsRequired();
            entity.Property(e => e.PreviousValue).HasMaxLength(1000);
            entity.Property(e => e.NewValue).HasMaxLength(1000);
            entity.Property(e => e.Reason).HasMaxLength(500);
        });

        modelBuilder.Entity<OperationLog>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany(u => u.OperationLogs)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.SetNull);
            entity.Property(e => e.Action).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Module).HasMaxLength(50).IsRequired();
            entity.Property(e => e.Detail).HasMaxLength(2000);
            entity.Property(e => e.IpAddress).HasMaxLength(50);
        });
    }
}
