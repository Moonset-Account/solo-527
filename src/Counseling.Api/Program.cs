using Counseling.Application;
using Counseling.Application.DTOs;
using Counseling.Infrastructure;
using Microsoft.AspNetCore.Diagnostics;
using System.Net;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "心理咨询到店核销系统 API",
        Version = "v1",
        Description = "服务调度员心理咨询到店核销工具 - 预约、核销、统计管理"
    });
});

builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddApplication();

var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins(corsOrigins)
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "心理咨询核销系统 API v1");
    });
}

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
        context.Response.ContentType = "application/json";

        var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        var exception = exceptionHandlerPathFeature?.Error;

        var errorMessage = exception?.Message ?? "服务器内部发生未知错误，请稍后重试或联系技术支持";
        var errorCode = 500;

        if (exception is ArgumentException || exception is InvalidOperationException)
        {
            context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
            errorCode = 400;
        }
        else if (exception is KeyNotFoundException || exception?.Message.Contains("不存在") == true)
        {
            context.Response.StatusCode = (int)HttpStatusCode.NotFound;
            errorCode = 404;
        }
        else if (exception is UnauthorizedAccessException)
        {
            context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
            errorCode = 401;
        }

        var response = new ApiResponse
        {
            Success = false,
            Message = errorMessage,
            Code = errorCode
        };

        var result = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        await context.Response.WriteAsync(result);
    });
});

app.UseHttpsRedirection();
app.UseCors("AllowReactApp");
app.UseAuthorization();
app.MapControllers();

app.Run();
