using AgricultureTraceability.API.Hubs;
using AgricultureTraceability.Application.Services;
using AgricultureTraceability.Domain.Interfaces;
using AgricultureTraceability.Infrastructure.Caching;
using AgricultureTraceability.Infrastructure.Data;
using AgricultureTraceability.Infrastructure.Repositories;
using AutoMapper;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore
    );

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b => b.MigrationsAssembly("AgricultureTraceability.Infrastructure")
    )
);

var redisConnectionString = builder.Configuration.GetConnectionString("RedisConnection");
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    ConnectionMultiplexer.Connect(redisConnectionString!)
);
builder.Services.AddSingleton<IRedisCacheService, RedisCacheService>();

builder.Services.AddAutoMapper(typeof(Program).Assembly);

builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IEnvironmentMonitorService, EnvironmentMonitorService>();
builder.Services.AddScoped<IThresholdService, ThresholdService>();
builder.Services.AddScoped<IAlertService, AlertService>();
builder.Services.AddScoped<IHarvestBatchService, HarvestBatchService>();
builder.Services.AddScoped<IPlotService, PlotService>();
builder.Services.AddScoped<IApplicationMaterialService, ApplicationMaterialService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IBatchOperationService, BatchOperationService>();
builder.Services.AddScoped<IQrCodeService, QrCodeService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
        });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "农事溯源平台 API",
        Version = "v1",
        Description = "蔬菜大棚环境监测与农事溯源系统"
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        await DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "数据库初始化失败");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowReactApp");

app.UseRouting();

app.UseAuthorization();

app.UseEndpoints(endpoints =>
{
    endpoints.MapControllers();
    endpoints.MapHub<AlertHub>("/hubs/alert");
});

app.Run();
