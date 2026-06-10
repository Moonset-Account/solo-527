using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class WorkstationConfiguration : IEntityTypeConfiguration<Workstation>
{
    public void Configure(EntityTypeBuilder<Workstation> builder)
    {
        builder.ToTable("Workstations");

        builder.HasKey(w => w.Id);

        builder.Property(w => w.Name)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(w => w.Type)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(w => w.Status)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("idle");

        builder.HasOne(w => w.CurrentAppointment)
            .WithOne()
            .HasForeignKey<Workstation>(w => w.CurrentAppointmentId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasMany(w => w.PartsShortages)
            .WithMany(ps => ps.Workstations)
            .UsingEntity(j => j.ToTable("PartsShortageWorkstations"));

        builder.HasIndex(w => w.Status);
    }
}
