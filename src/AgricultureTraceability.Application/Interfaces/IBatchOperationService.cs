using AgricultureTraceability.Application.DTOs;
using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Application.Interfaces;

public interface IBatchOperationService
{
    Task<BatchOperationResultDto> BatchUpdateMaterialStatusAsync(IEnumerable<Guid> materialIds, MaterialStatus newStatus, Guid? operatedBy = null);
    Task<BatchOperationResultDto> BatchUpdateAlertStatusAsync(IEnumerable<Guid> alertIds, AlertStatus newStatus, Guid? operatedBy = null);
    Task<BatchOperationResultDto> BatchUpdateOrderStatusAsync(IEnumerable<Guid> orderIds, OrderStatus newStatus, Guid? operatedBy = null);
    Task<BatchOperationResultDto> RetryFailedItemsAsync(Guid batchOperationId);
}
