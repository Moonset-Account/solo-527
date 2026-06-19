using CoworkingBooking.Application.Common;
using CoworkingBooking.Application.DTOs.Appointment;

namespace CoworkingBooking.Application.Interfaces;

public interface IAppointmentService
{
    Task<ApiResponse<PagedResult<AppointmentDto>>> GetListAsync(AppointmentQuery query);
    Task<ApiResponse<AppointmentDto>> GetByIdAsync(Guid id);
    Task<ApiResponse<AppointmentDto>> CreateAsync(CreateAppointmentRequest request, Guid? operatorId);
    Task<ApiResponse> AssignConsultantAsync(Guid id, AssignConsultantRequest request, Guid? operatorId);
    Task<ApiResponse> UpdateStatusAsync(Guid id, UpdateAppointmentStatusRequest request, Guid? operatorId);
    Task<ApiResponse> AddFollowUpAsync(Guid id, AddFollowUpRequest request, Guid operatorId);
    Task<ApiResponse> MarkAsNoShowAsync(Guid id, string? reason, Guid? operatorId);
    Task<ApiResponse<PagedResult<NoShowRecordDto>>> GetNoShowListAsync(NoShowQuery query);
    Task<ApiResponse<NoShowRecordDto>> GetNoShowByIdAsync(Guid id);
    Task<ApiResponse> HandleNoShowAsync(Guid noShowId, HandleNoShowRequest request, Guid handlerId);
    Task<ApiResponse<byte[]>> ExportAppointmentsAsync(AppointmentQuery query);
}
