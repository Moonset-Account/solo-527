using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class VehicleServiceRecordConfiguration : IEntityTypeConfiguration<VehicleServiceRecord>
{
    public void Configure(EntityTypeBuilder<VehicleServiceRecord> builder)
    {
        builder.ToTable("VehicleServiceRecords");

        builder.HasKey(vsr => vsr.Id);

        builder.Property(vsr => vsr.ServiceName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(vsr => vsr.TechnicianName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(vsr => vsr.CompletedAt)
            .IsRequired();

        builder.Property(vsr => vsr.Notes)
            .HasMaxLength(500);

        builder.HasIndex(vsr => vsr.VehicleId);
    }
}
