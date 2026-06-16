
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IAppointmentService
{
    Task<PagedResultDto<AppointmentDto>> GetListAsync(AppointmentQueryDto query);
    Task<AppointmentDto?> GetByIdAsync(int id, bool includeDetails = false);
    Task<AppointmentDto> CreateAsync(AppointmentCreateDto dto);
    Task<AppointmentDto?> UpdateAsync(int id, AppointmentUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<bool> UpdateStatusAsync(int id, int status);
}
