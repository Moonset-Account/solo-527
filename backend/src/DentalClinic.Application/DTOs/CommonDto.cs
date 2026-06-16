
namespace DentalClinic.Application.DTOs;

public abstract class PagedQueryDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortField { get; set; }
    public string? SortOrder { get; set; } = "desc";
}

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public class ApiResultDto
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public int Code { get; set; }
}

public class ApiResultDto<T> : ApiResultDto
{
    public T? Data { get; set; }
}
