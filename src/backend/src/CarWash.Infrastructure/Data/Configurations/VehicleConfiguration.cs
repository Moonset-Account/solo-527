using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.ToTable("Vehicles");

        builder.HasKey(v => v.Id);

        builder.Property(v => v.PlateNumber)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(v => v.Brand)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(v => v.Model)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(v => v.Color)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(v => v.Vin)
            .HasMaxLength(50);

        builder.Property(v => v.Notes)
            .HasMaxLength(500);

        builder.Property(v => v.Tags)
            .HasMaxLength(500);

        builder.HasMany(v => v.ServiceRecords)
            .WithOne(vsr => vsr.Vehicle)
            .HasForeignKey(vsr => vsr.VehicleId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(v => v.PlateNumber);
        builder.HasIndex(v => v.CustomerId);
    }
}
