
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IFeeItemService
{
    Task<List<FeeItemDto>> GetByAppointmentIdAsync(int appointmentId);
    Task<FeeItemDto> CreateAsync(FeeItemCreateDto dto);
    Task<FeeItemDto?> UpdateStatusAsync(int id, int status);
    Task<decimal> GetTotalAmountByAppointmentIdAsync(int appointmentId);
}
