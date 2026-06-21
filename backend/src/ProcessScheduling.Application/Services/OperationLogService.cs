using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class OperationLogService : IOperationLogService
{
    private readonly IUnitOfWork _unitOfWork;

    public OperationLogService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task LogAsync(string module, string action, string? detail, Guid? userId, string? ipAddress, bool isDowntimeRelated = false)
    {
        var log = new OperationLog
        {
            UserId = userId,
            Module = module,
            Action = action,
            Detail = detail,
            IpAddress = ipAddress,
            IsDowntimeRelated = isDowntimeRelated
        };

        await _unitOfWork.OperationLogs.AddAsync(log);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<OperationLogDto>> GetByUserAsync(Guid userId, DateTime startDate, DateTime endDate)
    {
        var logs = await _unitOfWork.OperationLogs.FindAsync(l =>
            l.UserId == userId && l.CreatedAt >= startDate && l.CreatedAt <= endDate);
        return logs.Select(MapToDto);
    }

    public async Task<IEnumerable<OperationLogDto>> GetDowntimeRelatedAsync(DateTime startDate, DateTime endDate)
    {
        var logs = await _unitOfWork.OperationLogs.FindAsync(l =>
            l.IsDowntimeRelated && l.CreatedAt >= startDate && l.CreatedAt <= endDate);
        return logs.Select(MapToDto);
    }

    private static OperationLogDto MapToDto(OperationLog log)
    {
        return new OperationLogDto
        {
            Id = log.Id,
            UserId = log.UserId,
            Username = log.User?.Username,
            Action = log.Action,
            Module = log.Module,
            Detail = log.Detail,
            IpAddress = log.IpAddress,
            IsDowntimeRelated = log.IsDowntimeRelated,
            CreatedAt = log.CreatedAt
        };
    }
}
