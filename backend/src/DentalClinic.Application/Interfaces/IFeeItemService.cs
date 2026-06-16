
using DentalClinic.Application.DTOs;

namespace DentalClinic.Application.Interfaces;

public interface IFeeItemService
{
    Task&lt;List&lt;FeeItemDto&gt;&gt; GetByAppointmentIdAsync(int appointmentId);
    Task&lt;FeeItemDto&gt; CreateAsync(FeeItemCreateDto dto);
    Task&lt;FeeItemDto?&gt; UpdateStatusAsync(int id, int status);
    Task&lt;decimal&gt; GetTotalAmountByAppointmentIdAsync(int appointmentId);
}
