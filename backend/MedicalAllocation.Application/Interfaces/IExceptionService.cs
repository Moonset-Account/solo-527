using MedicalAllocation.Application.DTOs;

namespace MedicalAllocation.Application.Interfaces;

public interface IExceptionService
{
    Task<ExceptionRecordDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExceptionRecordDTO>> GetAllAsync(ExceptionQueryDTO? query = null, CancellationToken cancellationToken = default);
    Task<ExceptionRecordDTO> CreateAsync(ExceptionCreateDTO dto, CancellationToken cancellationToken = default);
    Task<ExceptionRecordDTO?> ResolveAsync(ExceptionResolveDTO dto, CancellationToken cancellationToken = default);
    Task<ExceptionRecordDTO?> AssignResponsibleAsync(int exceptionId, int responsibleUserId, int assignedByUserId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default);
    Task<int> GetOpenCountAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<ExceptionRecordDTO>> GetOpenExceptionsAsync(int? responsibleUserId = null, CancellationToken cancellationToken = default);
}
