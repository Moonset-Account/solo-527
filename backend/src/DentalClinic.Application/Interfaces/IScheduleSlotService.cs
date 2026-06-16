
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IScheduleSlotService
{
    Task<List<ScheduleSlotDto>> GetListAsync(ScheduleSlotQueryDto query);
    Task<ScheduleSlotDto?> GetByIdAsync(int id);
    Task<ScheduleSlotDto> CreateAsync(ScheduleSlotCreateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<List<ScheduleSlotDto>> GetAvailableSlotsAsync(int doctorId, DateTime date);
    Task<List<ScheduleSlotDto>> GetSlotsByDateRangeAsync(int? clinicId, int? doctorId, DateTime startDate, DateTime endDate);
}
