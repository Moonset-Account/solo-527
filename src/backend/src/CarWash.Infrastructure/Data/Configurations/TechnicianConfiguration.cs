using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class TechnicianConfiguration : IEntityTypeConfiguration<Technician>
{
    public void Configure(EntityTypeBuilder<Technician> builder)
    {
        builder.ToTable("Technicians");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(t => t.Specialties)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(t => t.Status)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("available");

        builder.Property(t => t.CapacityDay)
            .IsRequired()
            .HasDefaultValue(8);

        builder.Property(t => t.CapacityUsed)
            .IsRequired()
            .HasDefaultValue(0);

        builder.HasOne(t => t.CurrentWorkstation)
            .WithOne(w => w.CurrentTechnician)
            .HasForeignKey<Workstation>(w => w.CurrentTechnicianId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(t => t.Status);
    }
}
