using Microsoft.EntityFrameworkCore;
using OpsWorkOrder.Data;
using OpsWorkOrder.Enums;
using OpsWorkOrder.Models;
using OpsWorkOrder.Common;

namespace OpsWorkOrder;

public static class DbInitializer
{
    public static async Task Initialize(AppDbContext context)
    {
        // context.Database.EnsureCreated();
        // 注意：实际生产中建议使用迁移，这里只提供种子数据初始化逻辑

        if (await context.Users.AnyAsync(u => u.UserName == "admin"))
        {
            return;
        }

        var adminUser = new User
        {
            UserName = "admin",
            PasswordHash = PasswordHelper.HashPassword("Admin@123456"),
            FullName = "系统管理员",
            Email = "admin@example.com",
            Phone = "13800000001",
            Role = UserRole.Admin,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(adminUser);

        var operatorUser = new User
        {
            UserName = "operator",
            PasswordHash = PasswordHelper.HashPassword("Operator@123"),
            FullName = "门店运维工程师",
            Email = "operator@example.com",
            Phone = "13800000002",
            Role = UserRole.StoreOperator,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(operatorUser);

        var operatorUser2 = new User
        {
            UserName = "operator2",
            PasswordHash = PasswordHelper.HashPassword("Operator@456"),
            FullName = "运维工程师小王",
            Email = "operator2@example.com",
            Phone = "13800000003",
            Role = UserRole.StoreOperator,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(operatorUser2);

        await context.SaveChangesAsync();

        var asset1 = new Asset
        {
            AssetCode = "SRV-001",
            Name = "门店数据库服务器",
            Type = AssetType.Server,
            Status = AssetStatus.Active,
            IpAddress = "192.168.1.10",
            Location = "北京门店机房A区",
            Description = "主数据库服务器，运行 SQL Server 2019",
            Configuration = "{\"cpu\":\"8核\",\"memory\":\"32GB\",\"disk\":\"1TB SSD\",\"os\":\"Windows Server 2019\"}",
            ResponsibleId = operatorUser.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Assets.Add(asset1);

        var asset2 = new Asset
        {
            AssetCode = "SRV-002",
            Name = "门店应用服务器",
            Type = AssetType.Server,
            Status = AssetStatus.Active,
            IpAddress = "192.168.1.11",
            Location = "北京门店机房A区",
            Description = "业务应用服务器",
            Configuration = "{\"cpu\":\"4核\",\"memory\":\"16GB\",\"disk\":\"500GB SSD\",\"os\":\"Windows Server 2019\"}",
            ResponsibleId = operatorUser2.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Assets.Add(asset2);

        var asset3 = new Asset
        {
            AssetCode = "NET-001",
            Name = "核心交换机",
            Type = AssetType.NetworkDevice,
            Status = AssetStatus.Active,
            IpAddress = "192.168.1.1",
            Location = "北京门店机房A区",
            Description = "核心网络核心交换机",
            Configuration = "{\"brand\":\"Cisco\",\"model\":\"Catalyst 2960\",\"ports\":24}",
            ResponsibleId = operatorUser.Id,
            CreatedAt = DateTime.UtcNow
        };
        context.Assets.Add(asset3);

        await context.SaveChangesAsync();

        var alert1 = new Alert
        {
            Title = "CPU使用率过高告警",
            Description = "服务器CPU使用率持续超过90%",
            Type = AlertType.HighCpu,
            Priority = AlertPriority.High,
            Status = AlertStatus.Pending,
            AssetId = asset1.Id,
            CreatedById = adminUser.Id,
            CreatedAt = DateTime.UtcNow.AddHours(-2),
            DueDate = DateTime.UtcNow.AddHours(4)
        };
        context.Alerts.Add(alert1);

        var alert2 = new Alert
        {
            Title = "磁盘空间不足告警",
            Description = "磁盘使用率达到85%",
            Type = AlertType.DiskFull,
            Priority = AlertPriority.Medium,
            Status = AlertStatus.Assigned,
            AssetId = asset2.Id,
            AssignedToId = operatorUser.Id,
            AssignedAt = DateTime.UtcNow.AddHours(-1),
            CreatedById = adminUser.Id,
            CreatedAt = DateTime.UtcNow.AddHours(-3),
            DueDate = DateTime.UtcNow.AddHours(10)
        };
        context.Alerts.Add(alert2);

        var alert3 = new Alert
        {
            Title = "应用程序异常",
            Description = "业务系统频繁报错",
            Type = AlertType.ApplicationError,
            Priority = AlertPriority.Critical,
            Status = AlertStatus.Processing,
            AssetId = asset2.Id,
            AssignedToId = operatorUser2.Id,
            AssignedAt = DateTime.UtcNow.AddHours(-5),
            StartedAt = DateTime.UtcNow.AddHours(-4),
            CreatedById = adminUser.Id,
            CreatedAt = DateTime.UtcNow.AddHours(-6),
            DueDate = DateTime.UtcNow.AddHours(2)
        };
        context.Alerts.Add(alert3);

        var alert4 = new Alert
        {
            Title = "安全漏洞告警",
            Description = "检测到高危安全漏洞需要修复",
            Type = AlertType.SecurityVulnerability,
            Priority = AlertPriority.High,
            Status = AlertStatus.Resolved,
            AssetId = asset1.Id,
            AssignedToId = operatorUser.Id,
            AssignedAt = DateTime.UtcNow.AddDays(-1),
            StartedAt = DateTime.UtcNow.AddDays(-1).AddHours(2),
            ResolvedAt = DateTime.UtcNow.AddHours(-5),
            CreatedById = adminUser.Id,
            CreatedAt = DateTime.UtcNow.AddDays(-2),
            DueDate = DateTime.UtcNow.AddDays(-1)
        };
        context.Alerts.Add(alert4);

        await context.SaveChangesAsync();

        var processLog1 = new AlertProcessLog
        {
            AlertId = alert3.Id,
            OperatorId = operatorUser2.Id,
            FromStatus = AlertStatus.Assigned,
            ToStatus = AlertStatus.Processing,
            ActionDescription = "开始处理告警",
            Remark = "已确认问题，正在排查应用程序日志",
            CreatedAt = DateTime.UtcNow.AddHours(-4)
        };
        context.AlertProcessLogs.Add(processLog1);

        var processLog2 = new AlertProcessLog
        {
            AlertId = alert4.Id,
            OperatorId = operatorUser.Id,
            FromStatus = AlertStatus.Assigned,
            ToStatus = AlertStatus.Processing,
            ActionDescription = "开始处理漏洞",
            Remark = "已下载补丁，准备实施修复",
            CreatedAt = DateTime.UtcNow.AddDays(-1).AddHours(2)
        };
        context.AlertProcessLogs.Add(processLog2);

        var processLog3 = new AlertProcessLog
        {
            AlertId = alert4.Id,
            OperatorId = operatorUser.Id,
            FromStatus = AlertStatus.Processing,
            ToStatus = AlertStatus.Resolved,
            ActionDescription = "漏洞已修复",
            Remark = "补丁已安装，漏洞已修复",
            CreatedAt = DateTime.UtcNow.AddHours(-5)
        };
        context.AlertProcessLogs.Add(processLog3);

        await context.SaveChangesAsync();

        var vuln1 = new Vulnerability
        {
            Name = "SQL注入漏洞",
            CveId = "CVE-2024-0001",
            Description = "数据库存在SQL注入漏洞，攻击者可通过特定输入获取敏感数据",
            Severity = AlertPriority.Critical,
            AssetId = asset1.Id,
            DiscoveredAt = DateTime.UtcNow.AddDays(-7),
            DueDate = DateTime.UtcNow.AddDays(-1),
            IsOverdue = true,
            ExtendCount = 0,
            RemediationPlan = "升级数据库补丁，参数化查询"
        };
        context.Vulnerabilities.Add(vuln1);

        var vuln2 = new Vulnerability
        {
            Name = "弱密码策略漏洞",
            CveId = "CVE-2024-0002",
            Description = "系统存在弱密码，容易被暴力破解",
            Severity = AlertPriority.High,
            AssetId = asset2.Id,
            DiscoveredAt = DateTime.UtcNow.AddDays(-3),
            DueDate = DateTime.UtcNow.AddDays(4),
            IsOverdue = false,
            ExtendCount = 0,
            RemediationPlan = "强制修改密码，启用双因素认证"
        };
        context.Vulnerabilities.Add(vuln2);

        await context.SaveChangesAsync();
    }
}
