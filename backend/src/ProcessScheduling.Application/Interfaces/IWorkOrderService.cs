using ProcessScheduling.Application.DTOs;

namespace ProcessScheduling.Application.Interfaces;

public interface IWorkOrderService
{
    Task<IEnumerable<WorkOrderDto>> GetAllAsync();
    Task<WorkOrderDto?> GetByIdAsync(Guid id);
    Task<WorkOrderDto> CreateAsync(WorkOrderDto dto);
    Task UpdateAsync(WorkOrderDto dto);
}
