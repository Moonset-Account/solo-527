using System.Text;
using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ArtEduScheduler API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [token]",
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
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var jwtKey = builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key is not configured");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin", "Principal"));
});

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connString = builder.Configuration.GetConnectionString("DefaultConnection");
    if (!string.IsNullOrEmpty(connString) && !connString.Contains("YourPassword"))
    {
        options.UseSqlServer(connString);
    }
    else
    {
        options.UseInMemoryDatabase("ArtEduSchedulerInMemory");
    }
});

var redisConnString = builder.Configuration.GetConnectionString("Redis");
if (!string.IsNullOrEmpty(redisConnString) && !redisConnString.Contains("localhost:6379,abortConnect=false"))
{
    try
    {
        builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnString));
        builder.Services.AddSingleton<ICacheService, RedisCacheService>();
    }
    catch
    {
        builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
    }
}
else
{
    builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
}

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IClassService, ClassService>();
builder.Services.AddScoped<IScheduleService, ScheduleService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<ILeaveService, LeaveService>();
builder.Services.AddScoped<IFeedbackService, FeedbackService>();
builder.Services.AddScoped<IOperationLogService, OperationLogService>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<IHoursWarningService, HoursWarningService>();
builder.Services.AddScoped<IBatchOperationService, BatchOperationService>();
builder.Services.AddScoped<IReportService, ReportService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "ArtEduScheduler API v1"));
}

app.UseCors("AllowReactApp");
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapFallbackToFile("index.html");

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.Initialize(context);
}

app.Run();
