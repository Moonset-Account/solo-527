using AgricultureTraceability.Domain.Dtos;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IBatchOperationService
{
    Task<BatchOperationResultDto> BatchUpdateMaterialStatusAsync(IEnumerable<Guid> materialIds, MaterialStatus newStatus, Guid operatorId, string? remark = null);
    Task<BatchOperationResultDto> BatchUpdateAlertStatusAsync(IEnumerable<Guid> alertIds, AlertStatus newStatus, Guid operatorId);
    Task<BatchOperationResultDto> BatchUpdateOrderStatusAsync(IEnumerable<Guid> orderIds, OrderStatus newStatus, Guid operatorId);
    Task<BatchOperationResultDto> RetryFailedItemsAsync(Guid batchOperationId, Guid operatorId);
    Task<IEnumerable<BatchOperation>> GetRecentOperationsAsync(int count = 20);
}
