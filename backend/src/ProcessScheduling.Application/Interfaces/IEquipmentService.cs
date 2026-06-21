using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Domain.Enums;

namespace ProcessScheduling.Application.Interfaces;

public interface IEquipmentService
{
    Task<IEnumerable<EquipmentDto>> GetAllAsync();
    Task<EquipmentDto?> GetByIdAsync(Guid id);
    Task<EquipmentDto> CreateAsync(CreateEquipmentDto dto);
    Task UpdateStatusAsync(Guid id, EquipmentStatus status, Guid operatorId, string? reason = null);
    Task<IEnumerable<EquipmentDto>> GetByStatusAsync(EquipmentStatus status);
    Task<EquipmentStatisticsDto> GetStatisticsAsync(Guid id, DateTime startDate, DateTime endDate);
}
