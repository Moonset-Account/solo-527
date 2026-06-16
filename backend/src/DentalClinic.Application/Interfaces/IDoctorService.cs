
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IDoctorService
{
    Task&lt;PagedResultDto&lt;DoctorDto&gt;&gt; GetListAsync(DoctorQueryDto query);
    Task&lt;List&lt;DoctorDto&gt;&gt; GetAllAsync(int? clinicId = null);
    Task&lt;DoctorDto?&gt; GetByIdAsync(int id);
    Task&lt;DoctorDto&gt; CreateAsync(DoctorCreateDto dto);
    Task&lt;DoctorDto?&gt; UpdateAsync(int id, DoctorUpdateDto dto);
    Task&lt;bool&gt; DeleteAsync(int id);
}
