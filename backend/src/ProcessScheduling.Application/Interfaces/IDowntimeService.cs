using ProcessScheduling.Application.DTOs;

namespace ProcessScheduling.Application.Interfaces;

public interface IDowntimeService
{
    Task<DowntimeRecordDto> StartDowntimeAsync(CreateDowntimeRecordDto dto);
    Task<DowntimeRecordDto> EndDowntimeAsync(Guid id, Guid operatorId);
    Task<IEnumerable<DowntimeRecordDto>> GetByEquipmentAsync(Guid equipmentId, DateTime startDate, DateTime endDate);
    Task<DowntimeRecordDto?> GetByIdAsync(Guid id);
}
