
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Api;

public static class DatabaseInitializer
{
    public static async Task Initialize(PrintingFactoryDbContext context)
    {
        if (!context.Stores.Any())
        {
            var stores = new List<Store>
            {
                new() { Name = "中心门店", ContactPerson = "张三", Phone = "13800138001", Address = "市中心路1号", IsActive = true },
                new() { Name = "东区门店", ContactPerson = "李四", Phone = "13800138002", Address = "东区大道88号", IsActive = true },
                new() { Name = "西区门店", ContactPerson = "王五", Phone = "13800138003", Address = "西区街56号", IsActive = true },
                new() { Name = "南区门店", ContactPerson = "赵六", Phone = "13800138004", Address = "南区路200号", IsActive = true },
                new() { Name = "北区门店", ContactPerson = "钱七", Phone = "13800138005", Address = "北区工业园", IsActive = true }
            };
            await context.Stores.AddRangeAsync(stores);
        }

        if (!context.ProductionNodes.Any())
        {
            var nodes = new List<ProductionNode>
            {
                new() { Name = "订单确认", Code = "NODE-001", SortOrder = 1, EstimatedDurationMinutes = 30, Description = "确认订单信息和客户需求", IsActive = true },
                new() { Name = "制版", Code = "NODE-002", SortOrder = 2, EstimatedDurationMinutes = 120, Description = "制作印刷版", IsActive = true },
                new() { Name = "印刷", Code = "NODE-003", SortOrder = 3, EstimatedDurationMinutes = 240, Description = "上机印刷", IsActive = true },
                new() { Name = "覆膜", Code = "NODE-004", SortOrder = 4, EstimatedDurationMinutes = 60, Description = "表面覆膜处理", IsActive = true },
                new() { Name = "模切", Code = "NODE-005", SortOrder = 5, EstimatedDurationMinutes = 90, Description = "模切成型", IsActive = true },
                new() { Name = "质检", Code = "NODE-006", SortOrder = 6, EstimatedDurationMinutes = 60, Description = "质量检验", IsActive = true },
                new() { Name = "包装", Code = "NODE-007", SortOrder = 7, EstimatedDurationMinutes = 45, Description = "成品包装", IsActive = true }
            };
            await context.ProductionNodes.AddRangeAsync(nodes);
        }

        if (!context.Equipment.Any())
        {
            var equipments = new List<Equipment>
            {
                new() { Name = "海德堡印刷机1号", Code = "EQ-001", Type = "印刷机", Status = EquipmentStatus.Idle, Location = "车间A区", IsActive = true },
                new() { Name = "海德堡印刷机2号", Code = "EQ-002", Type = "印刷机", Status = EquipmentStatus.Idle, Location = "车间A区", IsActive = true },
                new() { Name = "小森印刷机", Code = "EQ-003", Type = "印刷机", Status = EquipmentStatus.Idle, Location = "车间A区", IsActive = true },
                new() { Name = "全自动覆膜机", Code = "EQ-004", Type = "覆膜机", Status = EquipmentStatus.Idle, Location = "车间B区", IsActive = true },
                new() { Name = "模切机1号", Code = "EQ-005", Type = "模切机", Status = EquipmentStatus.Idle, Location = "车间B区", IsActive = true },
                new() { Name = "模切机2号", Code = "EQ-006", Type = "模切机", Status = EquipmentStatus.Maintenance, Location = "车间B区", IsActive = true, LastMaintenanceDate = DateTime.UtcNow.AddDays(-30), NextMaintenanceDate = DateTime.UtcNow.AddDays(1) },
                new() { Name = "数码打样机", Code = "EQ-007", Type = "打样机", Status = EquipmentStatus.Idle, Location = "车间C区", IsActive = true },
                new() { Name = "自动包装线", Code = "EQ-008", Type = "包装设备", Status = EquipmentStatus.Idle, Location = "车间C区", IsActive = true }
            };
            await context.Equipment.AddRangeAsync(equipments);
        }

        await context.SaveChangesAsync();
    }
}
