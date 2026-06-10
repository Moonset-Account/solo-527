using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.Amount)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(p => p.Method)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(p => p.Status)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("pending");

        builder.Property(p => p.PaidAt)
            .IsRequired(false);

        builder.HasIndex(p => p.AppointmentId);
    }
}
