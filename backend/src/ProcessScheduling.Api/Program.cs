using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ProcessScheduling.Application;
using ProcessScheduling.Infrastructure;
using ProcessScheduling.Infrastructure.Cache;
using ProcessScheduling.Infrastructure.Data;
using ProcessScheduling.Infrastructure.Data.Seeders;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ProcessScheduling API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);

var jwtKey = builder.Configuration["Jwt:Key"] ?? "ProcessSchedulingSecretKeyForJwtToken2024";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "ProcessScheduling";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "ProcessSchedulingUsers";

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
    options.AddPolicy("WorkshopDirectorOrAdmin", policy =>
        policy.RequireRole("Admin", "WorkshopDirector"));
    options.AddPolicy("WorkerAndAbove", policy =>
        policy.RequireRole("Admin", "WorkshopDirector", "Worker"));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", builder =>
    {
        builder.AllowAnyOrigin()
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

var app = builder.Build();

var startupLogger = app.Services.GetRequiredService<ILogger<Program>>();
var config = app.Services.GetRequiredService<IConfiguration>();

string dbProvider;
string cacheProvider;

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var cacheService = scope.ServiceProvider.GetRequiredService<IRedisCacheService>();

    dbProvider = dbContext.Database.ProviderName?.Contains("Sqlite") == true ? "SQLite (Fallback)" : "SQL Server";
    cacheProvider = cacheService is MemoryCacheService ? "MemoryCache (Fallback)" : "Redis";
}

startupLogger.LogInformation("========================================");
startupLogger.LogInformation("  工序排程台 API 启动配置");
startupLogger.LogInformation("========================================");
startupLogger.LogInformation("  数据库:    {DbProvider}", dbProvider);
startupLogger.LogInformation("  缓存:      {CacheProvider}", cacheProvider);
startupLogger.LogInformation("  环境:      {Environment}", app.Environment.EnvironmentName);
if (dbProvider == "SQLite (Fallback)" || cacheProvider == "MemoryCache (Fallback)")
{
    startupLogger.LogWarning("  ⚠ 注意: 当前使用了 fallback 方案，生产环境请配置 SQL Server + Redis");
}
startupLogger.LogInformation("========================================");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        context.Database.EnsureCreated();
        await DataSeeder.SeedAsync(context);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "数据库初始化失败");
    }
}

app.UseCors("AllowAll");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
