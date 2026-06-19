using CoworkingBooking.Domain.Entities;
using CoworkingBooking.Domain.Enums;
using CoworkingBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CoworkingBooking.Api;

public static class DatabaseSeeder
{
    public static async Task SeedDatabaseAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        await context.Database.EnsureCreatedAsync();

        foreach (var role in Enum.GetValues<UserRole>())
        {
            if (!await roleManager.RoleExistsAsync(role.ToString()))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid> { Name = role.ToString() });
            }
        }

        if (!await userManager.Users.AnyAsync())
        {
            var admin = new ApplicationUser
            {
                UserName = "admin",
                RealName = "系统管理员",
                Email = "admin@coworking.com",
                Role = UserRole.SuperAdmin,
                Department = "IT部",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(admin, "Admin@123");
            await userManager.AddToRoleAsync(admin, UserRole.SuperAdmin.ToString());

            var finance = new ApplicationUser
            {
                UserName = "finance",
                RealName = "财务专员",
                Email = "finance@coworking.com",
                Role = UserRole.Finance,
                Department = "财务部",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(finance, "Finance@123");
            await userManager.AddToRoleAsync(finance, UserRole.Finance.ToString());

            var consultantMgr = new ApplicationUser
            {
                UserName = "manager",
                RealName = "顾问经理",
                Email = "manager@coworking.com",
                Role = UserRole.ConsultantManager,
                Department = "销售部",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(consultantMgr, "Manager@123");
            await userManager.AddToRoleAsync(consultantMgr, UserRole.ConsultantManager.ToString());

            var consultant = new ApplicationUser
            {
                UserName = "consultant",
                RealName = "张顾问",
                Email = "consultant@coworking.com",
                Role = UserRole.Consultant,
                Department = "销售部",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(consultant, "Consult@123");
            await userManager.AddToRoleAsync(consultant, UserRole.Consultant.ToString());

            var landlordMgr = new ApplicationUser
            {
                UserName = "landlord",
                RealName = "房东托管经理",
                Email = "landlord@coworking.com",
                Role = UserRole.LandlordManager,
                Department = "资产管理部",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            await userManager.CreateAsync(landlordMgr, "Landlord@123");
            await userManager.AddToRoleAsync(landlordMgr, UserRole.LandlordManager.ToString());
        }

        if (!await context.CoworkingSpaces.AnyAsync())
        {
            var spaces = new List<CoworkingSpace>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "张江科技园A座301独立办公室",
                    Code = "SP20240001",
                    Type = SpaceType.PrivateOffice,
                    Status = SpaceStatus.Available,
                    Address = "上海市浦东新区张江高科技园区博云路2号",
                    Building = "A座",
                    Floor = "3F",
                    Area = 80,
                    Capacity = 15,
                    Description = "精装修独立办公室，采光好，配备全套办公家具",
                    Facilities = "空调,网络,打印机,会议室,茶水间,24小时门禁",
                    LandlordName = "张江置业",
                    LandlordPhone = "021-58888888",
                    CreatedAt = DateTime.UtcNow,
                    Prices = new List<SpacePrice>
                    {
                        new() { Id = Guid.NewGuid(), PriceType = "月租", UnitPrice = 12000, Unit = "月", MinimumCharge = 36000, DepositAmount = 24000, EffectiveDate = DateTime.UtcNow, IsActive = true, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), PriceType = "日租", UnitPrice = 800, Unit = "天", MinimumCharge = 800, EffectiveDate = DateTime.UtcNow, IsActive = true, CreatedAt = DateTime.UtcNow }
                    }
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "静安寺共享工位B区",
                    Code = "SP20240002",
                    Type = SpaceType.HotDesk,
                    Status = SpaceStatus.Available,
                    Address = "上海市静安区南京西路1788号",
                    Building = "国际中心",
                    Floor = "12F",
                    Area = 200,
                    Capacity = 50,
                    Description = "开放式共享办公空间，灵活工位，拎包入驻",
                    Facilities = "空调,WIFI,打印,茶水,储物柜,前台服务",
                    LandlordName = "Distrii办伴",
                    LandlordPhone = "021-62888888",
                    CreatedAt = DateTime.UtcNow,
                    Prices = new List<SpacePrice>
                    {
                        new() { Id = Guid.NewGuid(), PriceType = "日租", UnitPrice = 128, Unit = "天", MinimumCharge = 128, EffectiveDate = DateTime.UtcNow, IsActive = true, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), PriceType = "月租", UnitPrice = 2500, Unit = "月", MinimumCharge = 2500, DepositAmount = 2500, EffectiveDate = DateTime.UtcNow, IsActive = true, CreatedAt = DateTime.UtcNow }
                    }
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    Name = "陆家嘴金融中心会议室",
                    Code = "SP20240003",
                    Type = SpaceType.MeetingRoom,
                    Status = SpaceStatus.Available,
                    Address = "上海市浦东新区陆家嘴环路1000号",
                    Building = "恒生银行大厦",
                    Floor = "18F",
                    Area = 50,
                    Capacity = 20,
                    Description = "高端会议室，配备投影仪、视频会议系统",
                    Facilities = "投影仪,视频会议,白板,空调,WIFI,茶水服务",
                    LandlordName = "雷格斯",
                    LandlordPhone = "021-68888888",
                    CreatedAt = DateTime.UtcNow,
                    Prices = new List<SpacePrice>
                    {
                        new() { Id = Guid.NewGuid(), PriceType = "小时", UnitPrice = 300, Unit = "小时", MinimumCharge = 600, EffectiveDate = DateTime.UtcNow, IsActive = true, CreatedAt = DateTime.UtcNow },
                        new() { Id = Guid.NewGuid(), PriceType = "半天", UnitPrice = 1200, Unit = "半天", MinimumCharge = 1200, EffectiveDate = DateTime.UtcNow, IsActive = true, CreatedAt = DateTime.UtcNow }
                    }
                }
            };

            await context.CoworkingSpaces.AddRangeAsync(spaces);
            await context.SaveChangesAsync();
        }
    }
}
