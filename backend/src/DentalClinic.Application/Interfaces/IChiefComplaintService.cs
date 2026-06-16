
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IChiefComplaintService
{
    Task<ChiefComplaintDto?> GetByIdAsync(int id);
    Task<ChiefComplaintDto> CreateAsync(ChiefComplaintCreateDto dto);
    Task<List<ChiefComplaintDto>> GetByPatientIdAsync(int patientId);
    Task<ChiefComplaintDto?> GetLatestByPatientIdAsync(int patientId);
}
