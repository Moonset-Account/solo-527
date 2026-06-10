using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class AppointmentConfiguration : IEntityTypeConfiguration<Appointment>
{
    public void Configure(EntityTypeBuilder<Appointment> builder)
    {
        builder.ToTable("Appointments");

        builder.HasKey(a => a.Id);

        builder.Property(a => a.AppointmentTime)
            .IsRequired();

        builder.Property(a => a.Status)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("pending");

        builder.Property(a => a.Notes)
            .HasMaxLength(500);

        builder.HasOne(a => a.Technician)
            .WithMany(t => t.Appointments)
            .HasForeignKey(a => a.TechnicianId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Workstation)
            .WithMany()
            .HasForeignKey(a => a.WorkstationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(a => a.Payment)
            .WithOne(p => p.Appointment)
            .HasForeignKey<Payment>(p => p.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(a => a.CashierOrder)
            .WithOne(co => co.Appointment)
            .HasForeignKey<CashierOrder>(co => co.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(a => a.ServiceRecords)
            .WithOne(vsr => vsr.Appointment)
            .HasForeignKey(vsr => vsr.AppointmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(a => a.CustomerId);
        builder.HasIndex(a => a.Status);
        builder.HasIndex(a => a.AppointmentTime);
    }
}
