using CarWash.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CarWash.Infrastructure.Data;

public static class DbContextSeed
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (!await context.ServicePackages.AnyAsync())
        {
            await context.ServicePackages.AddRangeAsync(GetServicePackages());
            await context.SaveChangesAsync();
        }

        if (!await context.Technicians.AnyAsync())
        {
            await context.Technicians.AddRangeAsync(GetTechnicians());
            await context.SaveChangesAsync();
        }

        if (!await context.Workstations.AnyAsync())
        {
            await context.Workstations.AddRangeAsync(GetWorkstations());
            await context.SaveChangesAsync();
        }

        if (!await context.Customers.AnyAsync())
        {
            await context.Customers.AddRangeAsync(GetCustomers());
            await context.SaveChangesAsync();
        }
    }

    private static IEnumerable<ServicePackage> GetServicePackages()
    {
        return new List<ServicePackage>
        {
            new()
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "标准洗车",
                Price = 39.9m,
                DurationMinutes = 30,
                Type = "wash",
                Description = "外观冲洗、泡沫清洁、轮毂清洗、内饰吸尘",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "精洗套餐",
                Price = 89.9m,
                DurationMinutes = 60,
                Type = "wash",
                Description = "标准洗车 + 漆面去污、玻璃清洁、内饰深度清洁",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "全车打蜡",
                Price = 199.0m,
                DurationMinutes = 90,
                Type = "detail",
                Description = "精洗 + 漆面抛光、全车打蜡、轮胎上光",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
                Name = "内饰深度清洁",
                Price = 159.0m,
                DurationMinutes = 120,
                Type = "detail",
                Description = "座椅清洁、仪表盘保养、空调出风口清洁、地毯清洗",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("55555555-5555-5555-5555-555555555555"),
                Name = "漆面镀膜",
                Price = 599.0m,
                DurationMinutes = 180,
                Type = "detail",
                Description = "深度清洁 + 漆面还原、纳米镀膜、玻璃镀膜",
                IsActive = true
            },
            new()
            {
                Id = Guid.Parse("66666666-6666-6666-6666-666666666666"),
                Name = "小保养",
                Price = 299.0m,
                DurationMinutes = 60,
                Type = "repair",
                Description = "机油更换、机滤更换、全车检查",
                IsActive = true
            }
        };
    }

    private static IEnumerable<Technician> GetTechnicians()
    {
        return new List<Technician>
        {
            new()
            {
                Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
                Name = "张师傅",
                Specialties = "洗车,打蜡,镀膜",
                Status = "available",
                CapacityDay = 8,
                CapacityUsed = 0
            },
            new()
            {
                Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
                Name = "李师傅",
                Specialties = "洗车,内饰清洁,保养",
                Status = "available",
                CapacityDay = 8,
                CapacityUsed = 0
            },
            new()
            {
                Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
                Name = "王师傅",
                Specialties = "打蜡,镀膜,抛光",
                Status = "available",
                CapacityDay = 6,
                CapacityUsed = 0
            },
            new()
            {
                Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
                Name = "赵师傅",
                Specialties = "保养,维修,检测",
                Status = "off_duty",
                CapacityDay = 8,
                CapacityUsed = 0
            }
        };
    }

    private static IEnumerable<Workstation> GetWorkstations()
    {
        return new List<Workstation>
        {
            new()
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000001"),
                Name = "1号工位",
                Type = "wash",
                Status = "idle"
            },
            new()
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000002"),
                Name = "2号工位",
                Type = "wash",
                Status = "idle"
            },
            new()
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000003"),
                Name = "3号工位",
                Type = "detail",
                Status = "idle"
            },
            new()
            {
                Id = Guid.Parse("10000000-0000-0000-0000-000000000004"),
                Name = "4号工位",
                Type = "repair",
                Status = "maintenance"
            }
        };
    }

    private static IEnumerable<Customer> GetCustomers()
    {
        return new List<Customer>
        {
            new()
            {
                Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
                Phone = "13800138001",
                Name = "陈先生"
            },
            new()
            {
                Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
                Phone = "13800138002",
                Name = "刘女士"
            }
        };
    }
}
