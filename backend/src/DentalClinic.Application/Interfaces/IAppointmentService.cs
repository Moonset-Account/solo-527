
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IAppointmentService
{
    Task&lt;PagedResultDto&lt;AppointmentDto&gt;&gt; GetListAsync(AppointmentQueryDto query);
    Task&lt;AppointmentDto?&gt; GetByIdAsync(int id, bool includeDetails = false);
    Task&lt;AppointmentDto&gt; CreateAsync(AppointmentCreateDto dto);
    Task&lt;AppointmentDto?&gt; UpdateAsync(int id, AppointmentUpdateDto dto);
    Task&lt;bool&gt; DeleteAsync(int id);
    Task&lt;bool&gt; UpdateStatusAsync(int id, int status);
}
