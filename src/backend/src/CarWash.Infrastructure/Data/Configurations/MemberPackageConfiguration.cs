using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CarWash.Infrastructure.Data.Configurations;

public class MemberPackageConfiguration : IEntityTypeConfiguration<MemberPackage>
{
    public void Configure(EntityTypeBuilder<MemberPackage> builder)
    {
        builder.ToTable("MemberPackages");

        builder.HasKey(mp => mp.Id);

        builder.Property(mp => mp.Name)
            .IsRequired()
            .HasMaxLength(100);

        builder.Property(mp => mp.TotalCount)
            .IsRequired();

        builder.Property(mp => mp.RemainingCount)
            .IsRequired();

        builder.Property(mp => mp.ExpireAt)
            .IsRequired();
    }
}
