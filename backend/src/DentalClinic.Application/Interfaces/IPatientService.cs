
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IPatientService
{
    Task<PagedResultDto<PatientDto>> GetListAsync(PatientQueryDto query);
    Task<PatientDto?> GetByIdAsync(int id);
    Task<PatientDto> CreateAsync(PatientCreateDto dto);
    Task<PatientDto?> UpdateAsync(int id, PatientUpdateDto dto);
    Task<bool> DeleteAsync(int id);
    Task<PatientDto?> GetByPhoneAsync(string phone);
}
