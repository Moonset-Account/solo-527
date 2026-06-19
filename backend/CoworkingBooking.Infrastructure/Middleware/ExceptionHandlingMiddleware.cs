using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Text.Json;

namespace CoworkingBooking.Infrastructure.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IOperationLogService logService)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unhandled exception occurred");

            var errorId = Guid.NewGuid().ToString();
            var techDetail = $"{ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}";
            _logger.LogError($"ErrorId: {errorId}, Detail: {techDetail}");

            try
            {
                await logService.LogAsync(
                    module: "系统",
                    operation: "异常",
                    isSuccess: false,
                    errorMessage: $"[{errorId}] {ex.GetType().Name}: {ex.Message}"
                );
            }
            catch { }

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var userMessage = ex switch
            {
                UnauthorizedAccessException => "您没有权限执行此操作",
                InvalidOperationException => ex.Message,
                ArgumentException => ex.Message,
                KeyNotFoundException => ex.Message,
                _ => "服务器内部错误，请稍后重试或联系技术支持"
            };

            var response = new ApiResponse
            {
                Success = false,
                Message = userMessage,
                Code = 500
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }
    }
}

public class BusinessException : Exception
{
    public int Code { get; }

    public BusinessException(string message, int code = 400) : base(message)
    {
        Code = code;
    }
}
