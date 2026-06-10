using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class PartsShortageNodeConfiguration : IEntityTypeConfiguration<PartsShortageNode>
{
    public void Configure(EntityTypeBuilder<PartsShortageNode> builder)
    {
        builder.ToTable("PartsShortageNodes");

        builder.HasKey(psn => psn.Id);

        builder.Property(psn => psn.Status)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(psn => psn.OperatorId)
            .IsRequired();

        builder.Property(psn => psn.OperatorName)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(psn => psn.Timestamp)
            .IsRequired();

        builder.Property(psn => psn.Notes)
            .HasMaxLength(500);
    }
}
