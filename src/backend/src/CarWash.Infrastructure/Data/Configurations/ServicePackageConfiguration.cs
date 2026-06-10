using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class ServicePackageConfiguration : IEntityTypeConfiguration<ServicePackage>
{
    public void Configure(EntityTypeBuilder<ServicePackage> builder)
    {
        builder.ToTable("ServicePackages");

        builder.HasKey(sp => sp.Id);

        builder.Property(sp => sp.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(sp => sp.Price)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(sp => sp.DurationMinutes)
            .IsRequired();

        builder.Property(sp => sp.Type)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(sp => sp.Description)
            .HasMaxLength(500);

        builder.Property(sp => sp.IsActive)
            .IsRequired()
            .HasDefaultValue(true);

        builder.HasMany(sp => sp.Appointments)
            .WithOne(a => a.ServicePackage)
            .HasForeignKey(a => a.ServicePackageId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
