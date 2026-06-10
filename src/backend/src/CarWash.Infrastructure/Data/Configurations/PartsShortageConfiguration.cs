using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class PartsShortageConfiguration : IEntityTypeConfiguration<PartsShortage>
{
    public void Configure(EntityTypeBuilder<PartsShortage> builder)
    {
        builder.ToTable("PartsShortages");

        builder.HasKey(ps => ps.Id);

        builder.Property(ps => ps.PartName)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(ps => ps.AffectedServices)
            .HasMaxLength(500);

        builder.Property(ps => ps.AffectedWorkstationIds)
            .HasMaxLength(500);

        builder.Property(ps => ps.Status)
            .IsRequired()
            .HasMaxLength(20)
            .HasDefaultValue("reported");

        builder.Property(ps => ps.ReportedAt)
            .IsRequired();

        builder.Property(ps => ps.ResolvedAt)
            .IsRequired(false);

        builder.HasMany(ps => ps.Nodes)
            .WithOne(psn => psn.PartsShortage)
            .HasForeignKey(psn => psn.PartsShortageId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(ps => ps.Status);
    }
}
