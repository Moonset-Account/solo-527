using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Order;

namespace CoworkingBooking.Application.Interfaces;

public interface IOperationLogService
{
    Task LogAsync(string module, string operation, string? targetType = null, Guid? targetId = null, string? targetName = null, string? beforeData = null, string? afterData = null, bool isSuccess = true, string? errorMessage = null);
    Task<ApiResponse<PagedResult<OperationLogDto>>> GetListAsync(OperationLogQuery query);
    Task<ApiResponse<byte[]>> ExportLogsAsync(OperationLogQuery query);
}
