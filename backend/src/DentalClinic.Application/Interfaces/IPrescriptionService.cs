
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IPrescriptionService
{
    Task<PrescriptionDto?> GetByIdAsync(int id);
    Task<PrescriptionDto> CreateAsync(PrescriptionCreateDto dto);
    Task<List<PrescriptionDto>> GetByPatientIdAsync(int patientId);
    Task<List<PrescriptionDto>> GetByAppointmentIdAsync(int appointmentId);
}
