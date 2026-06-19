namespace CoworkingBooking.Application.Common;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public int Code { get; set; }

    public static ApiResponse<T> Ok(T data, string message = "操作成功")
    {
        return new ApiResponse<T> { Success = true, Message = message, Data = data, Code = 200 };
    }

    public static ApiResponse<T> Fail(string message, int code = 400)
    {
        return new ApiResponse<T> { Success = false, Message = message, Data = default, Code = code };
    }
}

public class ApiResponse : ApiResponse<object>
{
    public static ApiResponse Ok(string message = "操作成功")
    {
        return new ApiResponse { Success = true, Message = message, Data = null, Code = 200 };
    }

    public static ApiResponse Fail(string message, int code = 400)
    {
        return new ApiResponse { Success = false, Message = message, Data = null, Code = code };
    }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class PagedQuery
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Keyword { get; set; }
    public string? SortBy { get; set; }
    public bool SortDesc { get; set; } = true;
}
