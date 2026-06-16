
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IPatientService
{
    Task&lt;PagedResultDto&lt;PatientDto&gt;&gt; GetListAsync(PatientQueryDto query);
    Task&lt;PatientDto?&gt; GetByIdAsync(int id);
    Task&lt;PatientDto&gt; CreateAsync(PatientCreateDto dto);
    Task&lt;PatientDto?&gt; UpdateAsync(int id, PatientUpdateDto dto);
    Task&lt;bool&gt; DeleteAsync(int id);
    Task&lt;PatientDto?&gt; GetByPhoneAsync(string phone);
}
