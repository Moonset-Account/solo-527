using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class CashierOrderItemConfiguration : IEntityTypeConfiguration<CashierOrderItem>
{
    public void Configure(EntityTypeBuilder<CashierOrderItem> builder)
    {
        builder.ToTable("CashierOrderItems");

        builder.HasKey(oi => oi.Id);

        builder.Property(oi => oi.ServiceName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(oi => oi.Quantity)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(oi => oi.UnitPrice)
            .HasColumnType("decimal(10,2)")
            .IsRequired();

        builder.Property(oi => oi.PartsUsed)
            .HasMaxLength(500);
    }
}
