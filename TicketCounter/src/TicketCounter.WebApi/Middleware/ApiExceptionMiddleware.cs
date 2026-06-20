
using System.Net;
using System.Text.Json;
using TicketCounter.Application.Interfaces;
using TicketCounter.Application.Services;
using TicketCounter.Domain.Enums;

namespace TicketCounter.WebApi.Middleware;

public class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;

    public ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, IApiRetryService retryService)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "请求异常: {Path}", context.Request.Path);
            var request = context.Request;
            var requestBody = string.Empty;
            if (request.Body.CanSeek)
            {
                request.Body.Position = 0;
                using var reader = new StreamReader(request.Body, leaveOpen: true);
                requestBody = await reader.ReadToEndAsync();
            }
            try
            {
                await retryService.RecordFailureAsync(
                    apiName: $"{request.Method} {request.Path}",
                    httpMethod: request.Method,
                    requestUrl: $"{request.Scheme}://{request.Host}{request.Path}{request.QueryString}",
                    requestBody: requestBody,
                    statusCode: (int)HttpStatusCode.InternalServerError,
                    errorMessage: ex.Message,
                    responseBody: null,
                    stackTrace: ex.StackTrace,
                    correlationId: context.TraceIdentifier
                );
            }
            catch { }

            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var response = new
            {
                message = ex is KeyNotFoundException ? ex.Message : "服务器内部错误",
                traceId = context.TraceIdentifier,
                error = ex.InnerException?.Message
            };
            await context.Response.WriteAsync(JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            }));
        }
    }
}

public static class MiddlewareExtensions
{
    public static IApplicationBuilder UseApiExceptionHandler(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ApiExceptionMiddleware>();
    }
}
