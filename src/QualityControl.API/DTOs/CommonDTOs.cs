namespace QualityControl.API.DTOs;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public int Code { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public ErrorDetails? Error { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "操作成功")
    {
        return new ApiResponse<T>
        {
            Success = true,
            Code = 200,
            Message = message,
            Data = data
        };
    }

    public static ApiResponse<T> Fail(string message, int code = 400, ErrorDetails? error = null)
    {
        return new ApiResponse<T>
        {
            Success = false,
            Code = code,
            Message = message,
            Error = error
        };
    }
}

public class ErrorDetails
{
    public string ErrorCode { get; set; } = string.Empty;
    public string ErrorMessage { get; set; } = string.Empty;
    public string NextStep { get; set; } = string.Empty;
    public string? DetailedDescription { get; set; }
    public string? SupportUrl { get; set; }
    public Dictionary<string, object>? AdditionalInfo { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;
}

public class PagedQuery
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool SortDesc { get; set; } = true;
    public string? Keyword { get; set; }
}
