using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace MedicalAllocation.Infrastructure.Data;

public class MedicalAllocationDbContext : DbContext
{
    public MedicalAllocationDbContext(DbContextOptions<MedicalAllocationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Medicine> Medicines => Set<Medicine>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<MedicineBatch> MedicineBatches => Set<MedicineBatch>();
    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<ReplenishmentSuggestion> ReplenishmentSuggestions => Set<ReplenishmentSuggestion>();
    public DbSet<AllocationRequest> AllocationRequests => Set<AllocationRequest>();
    public DbSet<SupplierReply> SupplierReplies => Set<SupplierReply>();
    public DbSet<DiscrepancyRecord> DiscrepancyRecords => Set<DiscrepancyRecord>();
    public DbSet<ExceptionRecord> ExceptionRecords => Set<ExceptionRecord>();
    public DbSet<StockoutRiskTrend> StockoutRiskTrends => Set<StockoutRiskTrend>();
    public DbSet<StockAlert> StockAlerts => Set<StockAlert>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>().HasIndex(u => u.Username).IsUnique();
        modelBuilder.Entity<Warehouse>().HasIndex(w => w.Code).IsUnique();
        modelBuilder.Entity<Medicine>().HasIndex(m => m.Code).IsUnique();
        modelBuilder.Entity<Supplier>().HasIndex(s => s.Code).IsUnique();
        modelBuilder.Entity<AllocationRequest>().HasIndex(a => a.RequestNumber).IsUnique();
        modelBuilder.Entity<DiscrepancyRecord>().HasIndex(d => d.RecordNumber).IsUnique();
        modelBuilder.Entity<ExceptionRecord>().HasIndex(e => e.RecordNumber).IsUnique();
        modelBuilder.Entity<StockAlert>().HasIndex(s => s.AlertNumber).IsUnique();

        modelBuilder.Entity<MedicineBatch>()
            .HasIndex(mb => new { mb.MedicineId, mb.BatchNumber, mb.WarehouseId })
            .IsUnique();

        modelBuilder.Entity<Inventory>()
            .HasIndex(i => new { i.MedicineId, i.WarehouseId })
            .IsUnique();

        modelBuilder.Entity<StockoutRiskTrend>()
            .HasIndex(s => new { s.MedicineId, s.WarehouseId, s.RecordDate })
            .IsUnique();

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = "AQAAAAEAACcQAAAAEHsF4gFyL5VQp5Qq5kZp+eD5S8Q3T7X9Z6U4O2I8P9L0K1J3H5G7F9D8S6A4D2F1G0=",
                RealName = "系统管理员",
                Email = "admin@medical.com",
                Phone = "13800000001",
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1)
            },
            new User
            {
                Id = 2,
                Username = "planner01",
                PasswordHash = "AQAAAAEAACcQAAAAEHsF4gFyL5VQp5Qq5kZp+eD5S8Q3T7X9Z6U4O2I8P9L0K1J3H5G7F9D8S6A4D2F1G0=",
                RealName = "张采购",
                Email = "planner01@medical.com",
                Phone = "13800000002",
                Role = UserRole.Planner,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1)
            },
            new User
            {
                Id = 3,
                Username = "planner02",
                PasswordHash = "AQAAAAEAACcQAAAAEHsF4gFyL5VQp5Qq5kZp+eD5S8Q3T7X9Z6U4O2I8P9L0K1J3H5G7F9D8S6A4D2F1G0=",
                RealName = "李计划",
                Email = "planner02@medical.com",
                Phone = "13800000003",
                Role = UserRole.Planner,
                IsActive = true,
                CreatedAt = new DateTime(2024, 1, 1)
            }
        );

        modelBuilder.Entity<Warehouse>().HasData(
            new Warehouse { Id = 1, Code = "WH001", Name = "中央仓库", Address = "北京市朝阳区医药园区1号", Manager = "王仓管", Phone = "13900000001", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Warehouse { Id = 2, Code = "WH002", Name = "华东分仓", Address = "上海市浦东新区物流大道88号", Manager = "赵主管", Phone = "13900000002", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Warehouse { Id = 3, Code = "WH003", Name = "华南分仓", Address = "广州市白云区仓储路66号", Manager = "钱经理", Phone = "13900000003", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Warehouse { Id = 4, Code = "WH004", Name = "华西分仓", Address = "成都市高新区工业园99号", Manager = "孙主任", Phone = "13900000004", IsActive = true, CreatedAt = new DateTime(2024, 1, 1) }
        );

        modelBuilder.Entity<Supplier>().HasData(
            new Supplier { Id = 1, Code = "SUP001", Name = "华北制药集团有限公司", ContactPerson = "刘总", Phone = "13700000001", Email = "liu@huabei-pharma.com", Address = "河北省石家庄市医药产业基地", BusinessLicense = "91130000123456789A", GspCertificate = "GSP-HEB-001", Rating = 5, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Supplier { Id = 2, Code = "SUP002", Name = "扬子江药业集团", ContactPerson = "陈经理", Phone = "13700000002", Email = "chen@yangtze.com", Address = "江苏省泰州市扬子江路1号", BusinessLicense = "91320000234567890B", GspCertificate = "GSP-JS-002", Rating = 4, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Supplier { Id = 3, Code = "SUP003", Name = "石药控股集团", ContactPerson = "周主任", Phone = "13700000003", Email = "zhou@cspc.com", Address = "河北省石家庄市石药工业园", BusinessLicense = "91130000345678901C", GspCertificate = "GSP-HEB-003", Rating = 4, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Supplier { Id = 4, Code = "SUP004", Name = "广州白云山制药", ContactPerson = "吴部长", Phone = "13700000004", Email = "wu@bys.com", Address = "广东省广州市白云区云祥路", BusinessLicense = "91440000456789012D", GspCertificate = "GSP-GD-004", Rating = 5, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Supplier { Id = 5, Code = "SUP005", Name = "四川科伦药业", ContactPerson = "郑总监", Phone = "13700000005", Email = "zheng@kelun.com", Address = "四川省成都市新都卫星城", BusinessLicense = "91510000567890123E", GspCertificate = "GSP-SC-005", Rating = 3, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) }
        );

        modelBuilder.Entity<Medicine>().HasData(
            new Medicine { Id = 1, Code = "MED001", Name = "阿莫西林胶囊", GenericName = "阿莫西林", Specification = "0.25g*24粒", Unit = "盒", Manufacturer = "华北制药", ApprovalNumber = "国药准字H13021770", Category = "抗生素类", SafetyStock = 500, MaxStock = 5000, LeadTimeDays = 7, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 2, Code = "MED002", Name = "头孢克肟分散片", GenericName = "头孢克肟", Specification = "0.1g*6片", Unit = "盒", Manufacturer = "扬子江药业", ApprovalNumber = "国药准字H20040323", Category = "抗生素类", SafetyStock = 300, MaxStock = 3000, LeadTimeDays = 5, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 3, Code = "MED003", Name = "布洛芬缓释胶囊", GenericName = "布洛芬", Specification = "0.3g*20粒", Unit = "盒", Manufacturer = "石药集团", ApprovalNumber = "国药准字H10900089", Category = "解热镇痛", SafetyStock = 800, MaxStock = 8000, LeadTimeDays = 3, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 4, Code = "MED004", Name = "复方丹参片", GenericName = "复方丹参", Specification = "60片", Unit = "瓶", Manufacturer = "白云山制药", ApprovalNumber = "国药准字Z44020300", Category = "心血管类", SafetyStock = 600, MaxStock = 6000, LeadTimeDays = 10, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 5, Code = "MED005", Name = "氯化钠注射液", GenericName = "氯化钠", Specification = "0.9% 250ml", Unit = "袋", Manufacturer = "科伦药业", ApprovalNumber = "国药准字H20043900", Category = "输液类", SafetyStock = 2000, MaxStock = 20000, LeadTimeDays = 2, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 6, Code = "MED006", Name = "维生素C片", GenericName = "维生素C", Specification = "0.1g*100片", Unit = "瓶", Manufacturer = "华北制药", ApprovalNumber = "国药准字H13020800", Category = "维生素类", SafetyStock = 1000, MaxStock = 10000, LeadTimeDays = 5, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 7, Code = "MED007", Name = "奥美拉唑肠溶胶囊", GenericName = "奥美拉唑", Specification = "20mg*14粒", Unit = "盒", Manufacturer = "石药集团", ApprovalNumber = "国药准字H20044800", Category = "消化系统", SafetyStock = 400, MaxStock = 4000, LeadTimeDays = 7, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 8, Code = "MED008", Name = "双黄连口服液", GenericName = "双黄连", Specification = "10ml*10支", Unit = "盒", Manufacturer = "白云山制药", ApprovalNumber = "国药准字Z44021599", Category = "感冒用药", SafetyStock = 700, MaxStock = 7000, LeadTimeDays = 6, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 9, Code = "MED009", Name = "葡萄糖注射液", GenericName = "葡萄糖", Specification = "5% 500ml", Unit = "袋", Manufacturer = "科伦药业", ApprovalNumber = "国药准字H20045600", Category = "输液类", SafetyStock = 1500, MaxStock = 15000, LeadTimeDays = 2, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) },
            new Medicine { Id = 10, Code = "MED010", Name = "左氧氟沙星片", GenericName = "左氧氟沙星", Specification = "0.5g*5片", Unit = "盒", Manufacturer = "扬子江药业", ApprovalNumber = "国药准字H20010220", Category = "抗生素类", SafetyStock = 250, MaxStock = 2500, LeadTimeDays = 8, IsActive = true, CreatedAt = new DateTime(2024, 1, 1) }
        );
    }
}
