using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class CashierOrderConfiguration : IEntityTypeConfiguration<CashierOrder>
{
    public void Configure(EntityTypeBuilder<CashierOrder> builder)
    {
        builder.ToTable("CashierOrders");

        builder.HasKey(co => co.Id);

        builder.Property(co => co.Subtotal)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(co => co.Discount)
            .HasColumnType("decimal(10,2)")
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(co => co.Total)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(co => co.PaymentMethod)
            .IsRequired()
            .HasMaxLength(20);

        builder.Property(co => co.PaymentStatus)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("pending");

        builder.HasMany(co => co.Items)
            .WithOne(oi => oi.CashierOrder)
            .HasForeignKey(oi => oi.CashierOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(co => co.AppointmentId);
    }
}
