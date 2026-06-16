
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IDoctorService
{
    Task<PagedResultDto<DoctorDto>> GetListAsync(DoctorQueryDto query);
    Task<List<DoctorDto>> GetAllAsync(int? clinicId = null);
    Task<DoctorDto?> GetByIdAsync(int id);
    Task<DoctorDto> CreateAsync(DoctorCreateDto dto);
    Task<DoctorDto?> UpdateAsync(int id, DoctorUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}
