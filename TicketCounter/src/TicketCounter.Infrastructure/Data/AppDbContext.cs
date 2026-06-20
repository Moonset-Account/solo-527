
using Microsoft.EntityFrameworkCore;
using TicketCounter.Domain.Entities;
using TicketCounter.Domain.Enums;

namespace TicketCounter.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Session> Sessions { get; set; }
    public DbSet<Seat> Seats { get; set; }
    public DbSet<TicketStock> TicketStocks { get; set; }
    public DbSet<Registration> Registrations { get; set; }
    public DbSet<RegistrationAudit> RegistrationAudits { get; set; }
    public DbSet<OperationLog> OperationLogs { get; set; }
    public DbSet<TodoItem> TodoItems { get; set; }
    public DbSet<ApiRetryRecord> ApiRetryRecords { get; set; }
    public DbSet<InventoryOccupancy> InventoryOccupancies { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Session>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.Name).HasMaxLength(200).IsRequired();
            b.Property(s => s.Venue).HasMaxLength(500);
            b.Property(s => s.Status).HasConversion<string>();
            b.Property(s => s.CreatedBy).HasMaxLength(100);
            b.Property(s => s.UpdatedBy).HasMaxLength(100);
            b.HasIndex(s => s.Status);
            b.HasIndex(s => s.StartTime);
        });

        modelBuilder.Entity<Seat>(b =>
        {
            b.HasKey(s => s.Id);
            b.Property(s => s.SeatCode).HasMaxLength(50).IsRequired();
            b.Property(s => s.Row).HasMaxLength(20);
            b.Property(s => s.Area).HasMaxLength(100);
            b.Property(s => s.Status).HasConversion<string>();
            b.Property(s => s.TicketType).HasConversion<string>();
            b.Property(s => s.LockedBy).HasMaxLength(100);
            b.HasIndex(s => s.SessionId);
            b.HasIndex(s => s.Status);
            b.HasIndex(s => s.SeatCode);
            b.HasOne(s => s.Session)
                .WithMany(s => s.Seats)
                .HasForeignKey(s => s.SessionId)
                .OnDelete(DeleteBehavior.Restrict);
            b.HasOne(s => s.Registration)
                .WithMany(r => r.Seats)
                .HasForeignKey(s => s.RegistrationId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<TicketStock>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.TicketTypeName).HasMaxLength(100).IsRequired();
            b.Property(t => t.TicketType).HasConversion<string>();
            b.HasIndex(t => t.SessionId);
            b.HasIndex(t => t.TicketType);
            b.HasOne(t => t.Session)
                .WithMany(s => s.TicketStocks)
                .HasForeignKey(t => t.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Registration>(b =>
        {
            b.HasKey(r => r.Id);
            b.Property(r => r.RegistrationNo).HasMaxLength(50).IsRequired();
            b.Property(r => r.Status).HasConversion<string>();
            b.Property(r => r.Source).HasConversion<string>();
            b.Property(r => r.TicketType).HasConversion<string>();
            b.Property(r => r.Name).HasMaxLength(100).IsRequired();
            b.Property(r => r.Company).HasMaxLength(200);
            b.Property(r => r.Position).HasMaxLength(200);
            b.Property(r => r.Phone).HasMaxLength(30);
            b.Property(r => r.Email).HasMaxLength(200);
            b.Property(r => r.IdCard).HasMaxLength(30);
            b.Property(r => r.Wechat).HasMaxLength(100);
            b.Property(r => r.Industry).HasMaxLength(200);
            b.Property(r => r.City).HasMaxLength(100);
            b.Property(r => r.MissingFields).HasMaxLength(1000);
            b.Property(r => r.Reviewer).HasMaxLength(100);
            b.Property(r => r.ReviewComment).HasMaxLength(2000);
            b.Property(r => r.CreatedBy).HasMaxLength(100);
            b.Property(r => r.UpdatedBy).HasMaxLength(100);
            b.Property(r => r.Remark).HasMaxLength(2000);
            b.HasIndex(r => r.Status);
            b.HasIndex(r => r.RegistrationNo).IsUnique();
            b.HasIndex(r => r.Phone);
            b.HasIndex(r => r.SessionId);
            b.HasIndex(r => r.Name);
            b.HasOne(r => r.Session)
                .WithMany(s => s.Registrations)
                .HasForeignKey(r => r.SessionId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<RegistrationAudit>(b =>
        {
            b.HasKey(a => a.Id);
            b.Property(a => a.FromStatus).HasConversion<string>();
            b.Property(a => a.ToStatus).HasConversion<string>();
            b.Property(a => a.Comment).HasMaxLength(2000);
            b.Property(a => a.Operator).HasMaxLength(100).IsRequired();
            b.Property(a => a.ChangedFields).HasMaxLength(2000);
            b.Property(a => a.OriginalValues).HasColumnType("NVARCHAR(MAX)");
            b.Property(a => a.NewValues).HasColumnType("NVARCHAR(MAX)");
            b.HasIndex(a => a.RegistrationId);
            b.HasIndex(a => a.OperatedAt);
            b.HasOne(a => a.Registration)
                .WithMany(r => r.Audits)
                .HasForeignKey(a => a.RegistrationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OperationLog>(b =>
        {
            b.HasKey(o => o.Id);
            b.Property(o => o.Action).HasConversion<string>();
            b.Property(o => o.ActionName).HasMaxLength(100).IsRequired();
            b.Property(o => o.EntityType).HasMaxLength(100).IsRequired();
            b.Property(o => o.EntityId).HasMaxLength(100);
            b.Property(o => o.EntityName).HasMaxLength(500);
            b.Property(o => o.Operator).HasMaxLength(100).IsRequired();
            b.Property(o => o.OperatorRole).HasMaxLength(100);
            b.Property(o => o.IpAddress).HasMaxLength(50);
            b.Property(o => o.UserAgent).HasMaxLength(500);
            b.Property(o => o.ChangedFields).HasMaxLength(2000);
            b.Property(o => o.OriginalValues).HasColumnType("NVARCHAR(MAX)");
            b.Property(o => o.NewValues).HasColumnType("NVARCHAR(MAX)");
            b.Property(o => o.ErrorMessage).HasMaxLength(2000);
            b.HasIndex(o => o.Action);
            b.HasIndex(o => o.EntityType);
            b.HasIndex(o => o.OperatedAt);
            b.HasIndex(o => o.Operator);
        });

        modelBuilder.Entity<TodoItem>(b =>
        {
            b.HasKey(t => t.Id);
            b.Property(t => t.Title).HasMaxLength(500).IsRequired();
            b.Property(t => t.Description).HasMaxLength(2000);
            b.Property(t => t.Priority).HasConversion<string>();
            b.Property(t => t.Status).HasConversion<string>();
            b.Property(t => t.RelatedType).HasMaxLength(100);
            b.Property(t => t.MissingFields).HasMaxLength(1000);
            b.Property(t => t.AssignedTo).HasMaxLength(100);
            b.Property(t => t.Resolver).HasMaxLength(100);
            b.Property(t => t.Resolution).HasMaxLength(2000);
            b.Property(t => t.CreatedBy).HasMaxLength(100);
            b.HasIndex(t => t.Status);
            b.HasIndex(t => t.Priority);
            b.HasIndex(t => t.CreatedAt);
            b.HasIndex(t => t.RelatedId);
        });

        modelBuilder.Entity<ApiRetryRecord>(b =>
        {
            b.HasKey(a => a.Id);
            b.Property(a => a.ApiName).HasMaxLength(200).IsRequired();
            b.Property(a => a.HttpMethod).HasMaxLength(20).IsRequired();
            b.Property(a => a.RequestUrl).HasMaxLength(1000).IsRequired();
            b.Property(a => a.RequestBody).HasColumnType("NVARCHAR(MAX)");
            b.Property(a => a.RequestHeaders).HasColumnType("NVARCHAR(MAX)");
            b.Property(a => a.ResponseBody).HasColumnType("NVARCHAR(MAX)");
            b.Property(a => a.ErrorMessage).HasMaxLength(2000);
            b.Property(a => a.StackTrace).HasColumnType("NVARCHAR(MAX)");
            b.Property(a => a.RetryStatus).HasConversion<string>();
            b.Property(a => a.CorrelationId).HasMaxLength(100);
            b.HasIndex(a => a.RetryStatus);
            b.HasIndex(a => a.ApiName);
            b.HasIndex(a => a.CreatedAt);
            b.HasIndex(a => a.NextRetryAt);
        });

        modelBuilder.Entity<InventoryOccupancy>(b =>
        {
            b.HasKey(i => i.Id);
            b.Property(i => i.TicketType).HasConversion<string>();
            b.HasIndex(i => i.SessionId);
            b.HasIndex(i => i.TicketType);
            b.HasOne(i => i.Session)
                .WithMany()
                .HasForeignKey(i => i.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
