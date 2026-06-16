
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IScheduleSlotService
{
    Task&lt;List&lt;ScheduleSlotDto&gt;&gt; GetListAsync(ScheduleSlotQueryDto query);
    Task&lt;ScheduleSlotDto?&gt; GetByIdAsync(int id);
    Task&lt;ScheduleSlotDto&gt; CreateAsync(ScheduleSlotCreateDto dto);
    Task&lt;bool&gt; DeleteAsync(int id);
    Task&lt;List&lt;ScheduleSlotDto&gt;&gt; GetAvailableSlotsAsync(int doctorId, DateTime date);
    Task&lt;List&lt;ScheduleSlotDto&gt;&gt; GetSlotsByDateRangeAsync(int? clinicId, int? doctorId, DateTime startDate, DateTime endDate);
}
