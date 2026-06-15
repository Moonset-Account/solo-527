using System.Net;
using System.Text.Json;
using QualityControl.API.DTOs;

namespace QualityControl.API.Middleware;

public class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _logger;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        _logger.LogError(exception, "An unhandled exception occurred");

        var statusCode = HttpStatusCode.InternalServerError;
        var errorDetails = CreateErrorDetails(exception, ref statusCode);

        var response = ApiResponse<object>.Fail(
            message: errorDetails.ErrorMessage,
            code: (int)statusCode,
            error: errorDetails
        );

        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)statusCode;

        var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return context.Response.WriteAsync(json);
    }

    private static ErrorDetails CreateErrorDetails(Exception exception, ref HttpStatusCode statusCode)
    {
        return exception switch
        {
            KeyNotFoundException => new ErrorDetails
            {
                ErrorCode = "NOT_FOUND",
                ErrorMessage = exception.Message,
                NextStep = "请检查请求的资源ID是否正确，或联系管理员确认资源是否存在。",
                DetailedDescription = "请求访问的资源在系统中不存在。",
                SupportUrl = "/help/not-found"
            },
            UnauthorizedAccessException => new ErrorDetails
            {
                ErrorCode = "UNAUTHORIZED",
                ErrorMessage = "您没有权限执行此操作。",
                NextStep = "请确认您已登录，并且拥有访问该资源的权限。如需权限，请联系管理员申请。",
                DetailedDescription = "当前用户没有足够的权限执行该操作。",
                SupportUrl = "/help/permissions"
            },
            ArgumentException => new ErrorDetails
            {
                ErrorCode = "INVALID_ARGUMENT",
                ErrorMessage = exception.Message,
                NextStep = "请检查输入参数是否符合要求，参考API文档修正参数后重试。",
                DetailedDescription = "请求参数验证失败。",
                SupportUrl = "/help/api-docs"
            },
            InvalidOperationException => new ErrorDetails
            {
                ErrorCode = "INVALID_OPERATION",
                ErrorMessage = exception.Message,
                NextStep = "请确认当前状态是否允许执行该操作，按正确流程操作。",
                DetailedDescription = "当前状态下无法执行该操作。",
                SupportUrl = "/help/workflow"
            },
            _ => new ErrorDetails
            {
                ErrorCode = "INTERNAL_ERROR",
                ErrorMessage = "服务器内部错误，请稍后重试。",
                NextStep = "请稍后重试操作。如果问题持续存在，请联系技术支持并提供错误时间和操作描述。",
                DetailedDescription = "服务器在处理请求时发生了未预期的错误。",
                SupportUrl = "/support/ticket",
                AdditionalInfo = new Dictionary<string, object>
                {
                    ["timestamp"] = DateTime.UtcNow,
                    ["traceId"] = Guid.NewGuid().ToString()
                }
            }
        };
    }
}

public static class ErrorHandlingMiddlewareExtensions
{
    public static IApplicationBuilder UseErrorHandlingMiddleware(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ErrorHandlingMiddleware>();
    }
}
