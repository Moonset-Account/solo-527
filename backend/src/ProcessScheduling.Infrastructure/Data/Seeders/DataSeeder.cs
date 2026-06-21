using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Enums;
using ProcessScheduling.Infrastructure.Security;

namespace ProcessScheduling.Infrastructure.Data.Seeders;

public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (!context.Users.Any())
        {
            await SeedUsers(context);
        }

        if (!context.Shifts.Any())
        {
            await SeedShifts(context);
        }

        if (!context.Equipments.Any())
        {
            await SeedEquipments(context);
        }

        if (!context.Molds.Any())
        {
            await SeedMolds(context);
        }

        if (!context.ProcessStepTemplates.Any())
        {
            await SeedProcessStepTemplates(context);
        }

        if (!context.WorkOrders.Any())
        {
            await SeedWorkOrders(context);
        }
    }

    private static async Task SeedUsers(AppDbContext context)
    {
        var hasher = new PasswordHasher();

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Username = "admin",
            PasswordHash = hasher.HashPassword("admin123"),
            RealName = "系统管理员",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };

        var director = new User
        {
            Id = Guid.NewGuid(),
            Username = "director",
            PasswordHash = hasher.HashPassword("director123"),
            RealName = "张主任",
            Role = UserRole.WorkshopDirector,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };

        var worker1 = new User
        {
            Id = Guid.NewGuid(),
            Username = "worker1",
            PasswordHash = hasher.HashPassword("worker123"),
            RealName = "李工人",
            Role = UserRole.Worker,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };

        var worker2 = new User
        {
            Id = Guid.NewGuid(),
            Username = "worker2",
            PasswordHash = hasher.HashPassword("worker123"),
            RealName = "王工人",
            Role = UserRole.Worker,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };

        context.Users.AddRange(admin, director, worker1, worker2);
        await context.SaveChangesAsync();
    }

    private static async Task SeedShifts(AppDbContext context)
    {
        var morningShift = new Shift
        {
            Id = Guid.NewGuid(),
            Name = "早班",
            StartTime = new TimeSpan(8, 0, 0),
            EndTime = new TimeSpan(16, 0, 0),
            Leader = "张班长",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };

        var afternoonShift = new Shift
        {
            Id = Guid.NewGuid(),
            Name = "中班",
            StartTime = new TimeSpan(16, 0, 0),
            EndTime = new TimeSpan(0, 0, 0),
            Leader = "李班长",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };

        var nightShift = new Shift
        {
            Id = Guid.NewGuid(),
            Name = "晚班",
            StartTime = new TimeSpan(0, 0, 0),
            EndTime = new TimeSpan(8, 0, 0),
            Leader = "王班长",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };

        context.Shifts.AddRange(morningShift, afternoonShift, nightShift);
        await context.SaveChangesAsync();
    }

    private static async Task SeedEquipments(AppDbContext context)
    {
        var equipments = new List<Equipment>
        {
            new() { Id = Guid.NewGuid(), Code = "INJ-001", Name = "1号注塑机", Model = "HT-1000", Status = EquipmentStatus.Running, Location = "A区1号", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "INJ-002", Name = "2号注塑机", Model = "HT-1000", Status = EquipmentStatus.Processing, Location = "A区2号", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "INJ-003", Name = "3号注塑机", Model = "HT-1500", Status = EquipmentStatus.Stopped, Location = "A区3号", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "INJ-004", Name = "4号注塑机", Model = "HT-1500", Status = EquipmentStatus.Maintenance, Location = "B区1号", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "INJ-005", Name = "5号注塑机", Model = "HT-2000", Status = EquipmentStatus.Abnormal, Location = "B区2号", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "INJ-006", Name = "6号注塑机", Model = "HT-2000", Status = EquipmentStatus.Running, Location = "B区3号", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
        };

        context.Equipments.AddRange(equipments);
        await context.SaveChangesAsync();
    }

    private static async Task SeedMolds(AppDbContext context)
    {
        var molds = new List<Mold>
        {
            new() { Id = Guid.NewGuid(), Code = "MOLD-001", Name = "手机壳模具", Specification = "500T", TotalShots = 100000, CurrentShots = 35000, MaintenanceThreshold = 50000, Status = "Available", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "MOLD-002", Name = "充电器外壳", Specification = "300T", TotalShots = 80000, CurrentShots = 60000, MaintenanceThreshold = 40000, Status = "InUse", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "MOLD-003", Name = "汽车灯罩", Specification = "1000T", TotalShots = 200000, CurrentShots = 120000, MaintenanceThreshold = 100000, Status = "Available", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
        };

        context.Molds.AddRange(molds);
        await context.SaveChangesAsync();
    }

    private static async Task SeedProcessStepTemplates(AppDbContext context)
    {
        var steps = new List<ProcessStepTemplate>
        {
            new() { Id = Guid.NewGuid(), Code = "STEP-001", Name = "原料烘干", Sequence = 1, EstimatedMinutes = 60, RequireQc = false, Description = "原料预热烘干处理", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "STEP-002", Name = "注塑成型", Sequence = 2, EstimatedMinutes = 120, RequireQc = true, Description = "注塑成型工序", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "STEP-003", Name = "冷却定型", Sequence = 3, EstimatedMinutes = 30, RequireQc = false, Description = "产品冷却定型", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
            new() { Id = Guid.NewGuid(), Code = "STEP-004", Name = "质检包装", Sequence = 4, EstimatedMinutes = 45, RequireQc = true, Description = "质量检验和包装", CreatedAt = DateTime.UtcNow, CreatedBy = "System" },
        };

        context.ProcessStepTemplates.AddRange(steps);
        await context.SaveChangesAsync();
    }

    private static async Task SeedWorkOrders(AppDbContext context)
    {
        var templates = context.ProcessStepTemplates.OrderBy(t => t.Sequence).ToList();
        var firstEquipment = context.Equipments.FirstOrDefault();
        var firstShift = context.Shifts.FirstOrDefault();

        if (!templates.Any()) return;

        var workOrder = new WorkOrder
        {
            Id = Guid.NewGuid(),
            Code = "WO-20240601-001",
            ProductName = "手机保护壳",
            ProductCode = "PROD-001",
            PlannedQuantity = 5000,
            CompletedQuantity = 1200,
            DefectiveQuantity = 25,
            PlannedStartTime = DateTime.UtcNow.Date,
            PlannedEndTime = DateTime.UtcNow.Date.AddDays(3),
            ActualStartTime = DateTime.UtcNow.AddHours(-8),
            AssignedEquipmentId = firstEquipment?.Id,
            AssignedShiftId = firstShift?.Id,
            Remarks = "首批试产",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        };

        context.WorkOrders.Add(workOrder);
        await context.SaveChangesAsync();

        var stepInstances = templates.Select((t, i) => new ProcessStepInstance
        {
            Id = Guid.NewGuid(),
            WorkOrderId = workOrder.Id,
            ProcessStepTemplateId = t.Id,
            Status = i == 1 ? ProcessStepStatus.InProgress : (i < 1 ? ProcessStepStatus.Completed : ProcessStepStatus.Pending),
            EquipmentId = i <= 1 ? firstEquipment?.Id : null,
            OperatorId = i <= 1 ? context.Users.FirstOrDefault(u => u.Role == UserRole.Worker)?.Id : null,
            ShiftId = firstShift?.Id,
            StartedAt = i <= 1 ? DateTime.UtcNow.AddHours(-4 - i * 2) : null,
            CompletedAt = i < 1 ? DateTime.UtcNow.AddHours(-6) : null,
            OutputQuantity = i < 1 ? 1500 : null,
            DefectiveQuantity = i < 1 ? 30 : null,
            QrCode = $"QR-{workOrder.Code}-{t.Code}",
            CreatedAt = DateTime.UtcNow,
            CreatedBy = "System"
        }).ToList();

        context.ProcessStepInstances.AddRange(stepInstances);
        await context.SaveChangesAsync();
    }
}
