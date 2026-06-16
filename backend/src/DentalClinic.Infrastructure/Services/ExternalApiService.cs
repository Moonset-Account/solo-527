
using DentalClinic.Application.Interfaces;
using DentalClinic.Domain.Entities;
using DentalClinic.Infrastructure.Data;
using Polly;
using Polly.Retry;

namespace DentalClinic.Infrastructure.Services;

public interface IExternalApiService
{
    Task&lt;bool&gt; SendSmsAsync(string phone, string content, string? batchId = null);
    Task&lt;bool&gt; SendWechatNotificationAsync(string openId, string templateId, object data, string? batchId = null);
    Task&lt;bool&gt; SettleMedicalInsuranceAsync(int patientId, decimal amount, string? batchId = null);
}

public class ExternalApiService : IExternalApiService
{
    private readonly AppDbContext _context;
    private readonly HttpClient _httpClient;
    private readonly AsyncRetryPolicy _retryPolicy;
    private const int MaxRetryCount = 3;

    public ExternalApiService(AppDbContext context, HttpClient httpClient)
    {
        _context = context;
        _httpClient = httpClient;

        _retryPolicy = Policy
            .Handle&lt;HttpRequestException&gt;()
            .Or&lt;TaskCanceledException&gt;()
            .WaitAndRetryAsync(
                MaxRetryCount,
                retryAttempt =&gt; TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                async (exception, timeSpan, retryCount, context) =&gt;
                {
                    var apiName = context["ApiName"]?.ToString() ?? "Unknown";
                    var batchId = context["BatchId"]?.ToString();
                    await LogApiCallAsync(
                        apiName,
                        context["RequestUrl"]?.ToString() ?? "",
                        context["RequestBody"]?.ToString(),
                        null,
                        false,
                        exception.Message,
                        exception.GetType().Name,
                        GetSuggestion(exception),
                        retryCount,
                        batchId,
                        DateTime.Now.Add(-timeSpan),
                        null);
                });
    }

    public async Task&lt;bool&gt; SendSmsAsync(string phone, string content, string? batchId = null)
    {
        const string apiName = "短信发送接口";
        const string apiUrl = "https://api.sms.example.com/send";

        var requestBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            phone,
            content
        });

        var context = new Context
        {
            ["ApiName"] = apiName,
            ["RequestUrl"] = apiUrl,
            ["RequestBody"] = requestBody,
            ["BatchId"] = batchId ?? $"BATCH{DateTime.Now:yyyyMMddHHmmss}"
        };

        try
        {
            return await _retryPolicy.ExecuteAsync(async (ctx) =&gt;
            {
                var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
                request.Content = new StringContent(requestBody, System.Text.Encoding.UTF8, "application/json");

                var startTime = DateTime.Now;
                var response = await _httpClient.SendAsync(request);
                var duration = (DateTime.Now - startTime).TotalMilliseconds;
                var responseBody = await response.Content.ReadAsStringAsync();

                var isSuccess = response.IsSuccessStatusCode;

                await LogApiCallAsync(
                    apiName, apiUrl, requestBody, responseBody,
                    isSuccess, isSuccess ? null : response.ReasonPhrase,
                    isSuccess ? null : "HttpError",
                    isSuccess ? null : GetHttpStatusSuggestion((int)response.StatusCode),
                    0,
                    batchId,
                    startTime,
                    (long)duration);

                return isSuccess;
            }, context);
        }
        catch (Exception ex)
        {
            await LogApiCallAsync(
                apiName, apiUrl, requestBody, null,
                false, ex.Message, ex.GetType().Name,
                GetSuggestion(ex), MaxRetryCount, batchId, DateTime.Now, null);
            return false;
        }
    }

    public async Task&lt;bool&gt; SendWechatNotificationAsync(string openId, string templateId, object data, string? batchId = null)
    {
        const string apiName = "微信通知接口";
        const string apiUrl = "https://api.wechat.example.com/notify";

        var requestBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            openid = openId,
            template_id = templateId,
            data
        });

        var context = new Context
        {
            ["ApiName"] = apiName,
            ["RequestUrl"] = apiUrl,
            ["RequestBody"] = requestBody,
            ["BatchId"] = batchId ?? $"BATCH{DateTime.Now:yyyyMMddHHmmss}"
        };

        try
        {
            return await _retryPolicy.ExecuteAsync(async (ctx) =&gt;
            {
                var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
                request.Content = new StringContent(requestBody, System.Text.Encoding.UTF8, "application/json");

                var startTime = DateTime.Now;
                var response = await _httpClient.SendAsync(request);
                var duration = (DateTime.Now - startTime).TotalMilliseconds;
                var responseBody = await response.Content.ReadAsStringAsync();

                var isSuccess = response.IsSuccessStatusCode;

                await LogApiCallAsync(
                    apiName, apiUrl, requestBody, responseBody,
                    isSuccess, isSuccess ? null : response.ReasonPhrase,
                    isSuccess ? null : "HttpError",
                    isSuccess ? null : "请检查微信接口配置和模板ID是否正确",
                    0,
                    batchId,
                    startTime,
                    (long)duration);

                return isSuccess;
            }, context);
        }
        catch (Exception ex)
        {
            await LogApiCallAsync(
                apiName, apiUrl, requestBody, null,
                false, ex.Message, ex.GetType().Name,
                GetSuggestion(ex), MaxRetryCount, batchId, DateTime.Now, null);
            return false;
        }
    }

    public async Task&lt;bool&gt; SettleMedicalInsuranceAsync(int patientId, decimal amount, string? batchId = null)
    {
        const string apiName = "医保结算接口";
        const string apiUrl = "https://api.medical.example.com/settle";

        var requestBody = System.Text.Json.JsonSerializer.Serialize(new
        {
            patientId,
            amount
        });

        var context = new Context
        {
            ["ApiName"] = apiName,
            ["RequestUrl"] = apiUrl,
            ["RequestBody"] = requestBody,
            ["BatchId"] = batchId ?? $"BATCH{DateTime.Now:yyyyMMddHHmmss}"
        };

        try
        {
            return await _retryPolicy.ExecuteAsync(async (ctx) =&gt;
            {
                var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
                request.Content = new StringContent(requestBody, System.Text.Encoding.UTF8, "application/json");

                var startTime = DateTime.Now;
                var response = await _httpClient.SendAsync(request);
                var duration = (DateTime.Now - startTime).TotalMilliseconds;
                var responseBody = await response.Content.ReadAsStringAsync();

                var isSuccess = response.IsSuccessStatusCode;

                await LogApiCallAsync(
                    apiName, apiUrl, requestBody, responseBody,
                    isSuccess, isSuccess ? null : response.ReasonPhrase,
                    isSuccess ? null : "HttpError",
                    isSuccess ? null : "建议：1. 检查网络连接；2. 联系医保系统运维；3. 可在30分钟后重试",
                    0,
                    batchId,
                    startTime,
                    (long)duration);

                return isSuccess;
            }, context);
        }
        catch (Exception ex)
        {
            await LogApiCallAsync(
                apiName, apiUrl, requestBody, null,
                false, ex.Message, ex.GetType().Name,
                GetSuggestion(ex), MaxRetryCount, batchId, DateTime.Now, null);
            return false;
        }
    }

    private async Task LogApiCallAsync(
        string apiName, string requestUrl, string? requestBody, string? responseBody,
        bool isSuccess, string? errorMessage, string? errorType, string? suggestion,
        int retryCount, string? batchId, DateTime requestTime, long? durationMs)
    {
        var log = new ExternalApiLog
        {
            ApiName = apiName,
            BatchId = batchId,
            RequestUrl = requestUrl,
            RequestBody = requestBody,
            ResponseBody = responseBody,
            StatusCode = null,
            IsSuccess = isSuccess,
            ErrorMessage = errorMessage,
            ErrorType = errorType,
            Suggestion = suggestion,
            RetryCount = retryCount,
            RequestTime = requestTime,
            ResponseTime = durationMs.HasValue ? requestTime.AddMilliseconds(durationMs.Value) : null,
            DurationMs = durationMs
        };

        _context.ExternalApiLogs.Add(log);
        await _context.SaveChangesAsync();
    }

    private static string GetSuggestion(Exception ex)
    {
        return ex switch
        {
            HttpRequestException =&gt; "建议：1. 检查网络连接是否正常；2. 确认目标服务是否可达；3. 检查防火墙配置；4. 稍后重试",
            TaskCanceledException =&gt; "建议：1. 请求超时，检查目标服务响应速度；2. 考虑增加超时时间；3. 确认接口服务是否正常运行",
            _ =&gt; "建议：1. 查看详细错误日志；2. 联系系统管理员排查；3. 记录错误信息后重试"
        };
    }

    private static string GetHttpStatusSuggestion(int statusCode)
    {
        return statusCode switch
        {
            400 =&gt; "建议：1. 检查请求参数是否正确；2. 验证数据格式是否符合要求；3. 参考API文档修正请求",
            401 =&gt; "建议：1. 检查认证令牌是否有效；2. 确认权限是否足够；3. 重新获取认证令牌",
            403 =&gt; "建议：1. 确认访问权限；2. 检查IP白名单；3. 联系接口提供方开通权限",
            404 =&gt; "建议：1. 检查请求URL是否正确；2. 确认接口路径是否变更；3. 联系接口提供方确认",
            429 =&gt; "建议：1. 请求过于频繁；2. 降低请求频率；3. 申请更高的调用配额",
            500 =&gt; "建议：1. 服务端内部错误；2. 稍后重试；3. 联系接口服务方排查",
            502 =&gt; "建议：1. 网关错误；2. 检查上游服务状态；3. 稍后重试",
            503 =&gt; "建议：1. 服务不可用；2. 检查服务是否在维护；3. 稍后重试",
            504 =&gt; "建议：1. 网关超时；2. 检查上游服务响应速度；3. 稍后重试",
            _ =&gt; "建议：1. 查看错误详情；2. 参考API文档排查；3. 联系技术支持"
        };
    }
}
