using Microsoft.EntityFrameworkCore;
using QualityControl.API.Models;

namespace QualityControl.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Session> Sessions { get; set; }
    public DbSet<SessionMessage> SessionMessages { get; set; }
    public DbSet<QualityInspection> QualityInspections { get; set; }
    public DbSet<InspectionItem> InspectionItems { get; set; }
    public DbSet<InspectionTemplate> InspectionTemplates { get; set; }
    public DbSet<InspectionTemplateItem> InspectionTemplateItems { get; set; }
    public DbSet<Ticket> Tickets { get; set; }
    public DbSet<TicketComment> TicketComments { get; set; }
    public DbSet<KnowledgeBase> KnowledgeBases { get; set; }
    public DbSet<KnowledgeReviewRecord> KnowledgeReviewRecords { get; set; }
    public DbSet<ServiceRating> ServiceRatings { get; set; }
    public DbSet<Attachment> Attachments { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Agent> Agents { get; set; }
    public DbSet<Department> Departments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Session>()
            .HasIndex(s => s.SessionNumber)
            .IsUnique();

        modelBuilder.Entity<Session>()
            .HasOne(s => s.Customer)
            .WithMany(c => c.Sessions)
            .HasForeignKey(s => s.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Session>()
            .HasOne(s => s.Agent)
            .WithMany(a => a.Sessions)
            .HasForeignKey(s => s.AgentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Session>()
            .HasOne(s => s.Inspector)
            .WithMany()
            .HasForeignKey(s => s.InspectorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QualityInspection>()
            .HasIndex(qi => qi.InspectionNumber)
            .IsUnique();

        modelBuilder.Entity<QualityInspection>()
            .HasOne(qi => qi.Session)
            .WithOne(s => s.Inspection)
            .HasForeignKey<QualityInspection>(qi => qi.SessionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<QualityInspection>()
            .HasOne(qi => qi.Inspector)
            .WithMany(a => a.InspectionsAsInspector)
            .HasForeignKey(qi => qi.InspectorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Assignee)
            .WithMany(a => a.TicketsAsAssignee)
            .HasForeignKey(t => t.AssigneeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Creator)
            .WithMany(a => a.TicketsAsCreator)
            .HasForeignKey(t => t.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.Customer)
            .WithMany(c => c.Tickets)
            .HasForeignKey(t => t.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.AssigneeDepartment)
            .WithMany(d => d.Tickets)
            .HasForeignKey(t => t.AssigneeDepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ServiceRating>()
            .HasOne(sr => sr.Session)
            .WithOne(s => s.Rating)
            .HasForeignKey<ServiceRating>(sr => sr.SessionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ServiceRating>()
            .HasOne(sr => sr.Customer)
            .WithMany(c => c.Ratings)
            .HasForeignKey(sr => sr.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<ServiceRating>()
            .HasOne(sr => sr.Agent)
            .WithMany()
            .HasForeignKey(sr => sr.AgentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Agent>()
            .HasOne(a => a.Department)
            .WithMany(d => d.Agents)
            .HasForeignKey(a => a.DepartmentId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Department>()
            .HasOne(d => d.Manager)
            .WithMany()
            .HasForeignKey(d => d.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<KnowledgeBase>()
            .HasOne(kb => kb.Author)
            .WithMany()
            .HasForeignKey(kb => kb.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<KnowledgeBase>()
            .HasOne(kb => kb.Reviewer)
            .WithMany()
            .HasForeignKey(kb => kb.ReviewerId)
            .OnDelete(DeleteBehavior.Restrict);

        SeedData(modelBuilder);
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Department>().HasData(
            new Department { Id = 1, Name = "客服一部", Description = "一线客服部门", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Department { Id = 2, Name = "客服二部", Description = "二线客服部门", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Department { Id = 3, Name = "质检部", Description = "质量检查部门", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Department { Id = 4, Name = "技术支持部", Description = "技术支持部门", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Department { Id = 5, Name = "知识库管理部", Description = "知识库管理部门", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) }
        );

        modelBuilder.Entity<Agent>().HasData(
            new Agent { Id = 1, UserName = "admin", FullName = "系统管理员", DepartmentId = 3, Role = AgentRole.Admin, HireDate = new DateTime(2024, 1, 1), IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Agent { Id = 2, UserName = "inspector01", FullName = "张质检", DepartmentId = 3, Role = AgentRole.QualityInspector, Position = "质检主管", HireDate = new DateTime(2024, 1, 15), IsActive = true, CreatedAt = new DateTime(2024, 1, 15) },
            new Agent { Id = 3, UserName = "agent01", FullName = "李客服", DepartmentId = 1, Role = AgentRole.Agent, Position = "客服专员", HireDate = new DateTime(2024, 2, 1), IsActive = true, CreatedAt = new DateTime(2024, 2, 1) },
            new Agent { Id = 4, UserName = "agent02", FullName = "王客服", DepartmentId = 1, Role = AgentRole.SeniorAgent, Position = "高级客服", HireDate = new DateTime(2023, 6, 1), IsActive = true, CreatedAt = new DateTime(2023, 6, 1) },
            new Agent { Id = 5, UserName = "supervisor01", FullName = "赵主管", DepartmentId = 1, Role = AgentRole.Supervisor, Position = "客服主管", HireDate = new DateTime(2022, 1, 1), IsActive = true, CreatedAt = new DateTime(2022, 1, 1) }
        );

        modelBuilder.Entity<Customer>().HasData(
            new Customer { Id = 1, Name = "北京科技公司", Email = "contact@bjtech.com", Phone = "13800138001", CustomerLevel = "VIP", CompanyName = "北京科技有限公司", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Customer { Id = 2, Name = "上海贸易公司", Email = "info@shtrade.com", Phone = "13900139002", CustomerLevel = "普通", CompanyName = "上海贸易有限公司", IsActive = true, CreatedAt = new DateTime(2024, 2, 1) },
            new Customer { Id = 3, Name = "广州制造集团", Email = "service@gzmfg.com", Phone = "13700137003", CustomerLevel = "VIP", CompanyName = "广州制造集团", IsActive = true, CreatedAt = new DateTime(2024, 3, 1) }
        );

        modelBuilder.Entity<InspectionTemplate>().HasData(
            new InspectionTemplate { Id = 1, Name = "标准质检模板", Description = "通用客服会话质检标准模板", IsActive = true, Version = 1, ApplicableDepartment = "全部", CreatedAt = new DateTime(2024, 1, 1) }
        );

        modelBuilder.Entity<InspectionTemplateItem>().HasData(
            new InspectionTemplateItem { Id = 1, TemplateId = 1, ItemName = "服务态度", Description = "客服人员的服务态度是否友好、专业", Category = "服务质量", MaxScore = 20, SortOrder = 1, IsRequired = true },
            new InspectionTemplateItem { Id = 2, TemplateId = 1, ItemName = "响应速度", Description = "首次响应和后续响应是否及时", Category = "服务效率", MaxScore = 20, SortOrder = 2, IsRequired = true },
            new InspectionTemplateItem { Id = 3, TemplateId = 1, ItemName = "专业能力", Description = "是否能够准确解答客户问题", Category = "服务质量", MaxScore = 25, SortOrder = 3, IsRequired = true },
            new InspectionTemplateItem { Id = 4, TemplateId = 1, ItemName = "问题解决", Description = "客户问题是否得到有效解决", Category = "服务效果", MaxScore = 25, SortOrder = 4, IsRequired = true },
            new InspectionTemplateItem { Id = 5, TemplateId = 1, ItemName = "流程规范", Description = "是否按照标准流程处理", Category = "合规性", MaxScore = 10, SortOrder = 5, IsRequired = true }
        );
    }
}
