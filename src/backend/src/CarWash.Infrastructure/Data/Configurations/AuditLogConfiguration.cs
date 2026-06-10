using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");

        builder.HasKey(al => al.Id);

        builder.Property(al => al.EntityType)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(al => al.EntityId)
            .IsRequired();

        builder.Property(al => al.Action)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(al => al.OldValue)
            .HasColumnType("nvarchar(max)");

        builder.Property(al => al.NewValue)
            .HasColumnType("nvarchar(max)");

        builder.Property(al => al.OperatorId)
            .IsRequired();

        builder.Property(al => al.OperatorName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(al => al.Timestamp)
            .IsRequired();

        builder.Property(al => al.Notes)
            .HasMaxLength(500);

        builder.HasIndex(al => new { al.EntityType, al.EntityId });
        builder.HasIndex(al => al.Timestamp);
    }
}
