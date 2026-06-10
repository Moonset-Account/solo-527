using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface IAppointmentService
{
    Task<AppointmentResponse> CreateAsync(CreateAppointmentRequest request, CancellationToken cancellationToken = default);
    Task<AppointmentDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<AppointmentDto>> GetListAsync(AppointmentListRequest request, CancellationToken cancellationToken = default);
    Task<AppointmentDto> UpdateAsync(Guid id, UpdateAppointmentRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AppointmentDto> UpdateStatusAsync(Guid id, string status, Guid operatorId, string operatorName,
        CancellationToken cancellationToken = default);
    Task<List<AppointmentDto>> GetTodayAppointmentsAsync(CancellationToken cancellationToken = default);
}
