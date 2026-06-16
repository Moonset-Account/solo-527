
namespace DentalClinic.Application.DTOs;

public abstract class PagedQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortField { get; set; }
    public string? SortOrder { get; set; } = "desc";
}

public class PagedResultDto&lt;T&gt;
{
    public List&lt;T&gt; Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages =&gt; (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class ApiResultDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int Code { get; set; }
}

public class ApiResultDto&lt;T&gt; : ApiResultDto
{
    public T? Data { get; set; }
}
