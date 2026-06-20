
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;
using Microsoft.OpenApi.Models;
using TicketCounter.Infrastructure.Data;
using TicketCounter.Infrastructure;
using TicketCounter.Infrastructure.Cache;
using TicketCounter.WebApi.Middleware;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader()
              .WithExposedHeaders("Content-Disposition");
    });
});

builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.Converters.Add(new Newtonsoft.Json.Converters.StringEnumConverter());
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "票务核销台 API",
        Version = "v1",
        Description = "行业峰会座位库存后台管理系统 - 报名提交 / 座位场次 / 报名审核 / 库存统计 / 操作留痕 / 接口重试"
    });
    c.AddSecurityDefinition("X-Operator", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "当前操作员名称",
        Name = "X-Operator",
        Type = SecuritySchemeType.ApiKey
    });
});

var sqlConn = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? "Server=localhost;Database=TicketCounter;User Id=sa;Password=Your_password123;TrustServerCertificate=True;MultipleActiveResultSets=True;";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(sqlConn, b => b.MigrationsAssembly("TicketCounter.Infrastructure")));

var redisConn = builder.Configuration.GetConnectionString("RedisConnection") ?? "localhost:6379,abortConnect=false";
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(redisConn));

builder.Services.AddApplicationServices();

var app = builder.Build();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "票务核销台 API v1");
    });
}

app.UseApiExceptionHandler();

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("index.html");

try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }
}
catch (Exception ex)
{
    Console.WriteLine($"数据库初始化警告: {ex.Message}");
}

app.Run("http://localhost:5000");
