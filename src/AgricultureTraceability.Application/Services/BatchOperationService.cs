using AgricultureTraceability.API.Hubs;
using AgricultureTraceability.Application.DTOs;
using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Domain.Enums;
using AgricultureTraceability.Infrastructure.Data;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace AgricultureTraceability.Application.Services;

public class BatchOperationService : IBatchOperationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly AppDbContext _context;
    private readonly IHubContext<AlertHub>? _hubContext;

    public BatchOperationService(
        IUnitOfWork unitOfWork,
        AppDbContext context,
        IHubContext<AlertHub>? hubContext = null)
    {
        _unitOfWork = unitOfWork;
        _context = context;
        _hubContext = hubContext;
    }

    public async Task<BatchOperationResultDto> BatchUpdateMaterialStatusAsync(
        IEnumerable<Guid> materialIds,
        MaterialStatus newStatus,
        Guid? operatedBy = null)
    {
        var idList = materialIds.ToList();
        var result = new BatchOperationResultDto
        {
            TotalCount = idList.Count,
            BatchOperationId = Guid.NewGuid()
        };

        var batchOperation = new BatchOperation
        {
            Id = result.BatchOperationId,
            OperationType = $"BatchUpdateMaterialStatus-{newStatus}",
            OperatedAt = DateTime.Now,
            OperatedBy = operatedBy,
            Status = OperationStatus.Success
        };

        foreach (var materialId in idList)
        {
            var itemResult = new BatchOperationItemResultDto { EntityId = materialId };
            var operationItem = new BatchOperationItem
            {
                Id = Guid.NewGuid(),
                BatchOperationId = batchOperation.Id,
                EntityType = nameof(ApplicationMaterial),
                EntityId = materialId
            };

            try
            {
                var material = await _unitOfWork.ApplicationMaterials.GetByIdAsync(materialId);
                if (material == null)
                {
                    throw new KeyNotFoundException($"农资材料记录 {materialId} 不存在");
                }

                material.Status = newStatus;
                material.ApplicationDate = DateTime.Now;
                _unitOfWork.ApplicationMaterials.Update(material);

                operationItem.Success = true;
                itemResult.Success = true;
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                operationItem.Success = false;
                operationItem.ErrorMessage = ex.Message;
                itemResult.Success = false;
                itemResult.ErrorMessage = ex.Message;
                result.FailedCount++;
            }

            batchOperation.Items.Add(operationItem);
            result.Items.Add(itemResult);
        }

        batchOperation.Status = result.FailedCount == 0
            ? OperationStatus.Success
            : result.SuccessCount == 0
                ? OperationStatus.Failed
                : OperationStatus.PartialSuccess;

        batchOperation.Summary = $"共{result.TotalCount}条，成功{result.SuccessCount}条，失败{result.FailedCount}条";
        result.Summary = batchOperation.Summary;

        await _unitOfWork.BatchOperations.AddAsync(batchOperation);
        await _unitOfWork.SaveChangesAsync();

        return result;
    }

    public async Task<BatchOperationResultDto> BatchUpdateAlertStatusAsync(
        IEnumerable<Guid> alertIds,
        AlertStatus newStatus,
        Guid? operatedBy = null)
    {
        var idList = alertIds.ToList();
        var result = new BatchOperationResultDto
        {
            TotalCount = idList.Count,
            BatchOperationId = Guid.NewGuid()
        };

        var batchOperation = new BatchOperation
        {
            Id = result.BatchOperationId,
            OperationType = $"BatchUpdateAlertStatus-{newStatus}",
            OperatedAt = DateTime.Now,
            OperatedBy = operatedBy,
            Status = OperationStatus.Success
        };

        var updatedAlerts = new List<Alert>();

        foreach (var alertId in idList)
        {
            var itemResult = new BatchOperationItemResultDto { EntityId = alertId };
            var operationItem = new BatchOperationItem
            {
                Id = Guid.NewGuid(),
                BatchOperationId = batchOperation.Id,
                EntityType = nameof(Alert),
                EntityId = alertId
            };

            try
            {
                var alert = await _unitOfWork.Alerts.GetByIdAsync(alertId);
                if (alert == null)
                {
                    throw new KeyNotFoundException($"告警记录 {alertId} 不存在");
                }

                alert.Status = newStatus;
                if (newStatus == AlertStatus.Acknowledged || newStatus == AlertStatus.Resolved)
                {
                    if (alert.AcknowledgedAt == null)
                    {
                        alert.AcknowledgedAt = DateTime.Now;
                        alert.AcknowledgedBy = operatedBy;
                    }
                }

                _unitOfWork.Alerts.Update(alert);
                updatedAlerts.Add(alert);

                operationItem.Success = true;
                itemResult.Success = true;
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                operationItem.Success = false;
                operationItem.ErrorMessage = ex.Message;
                itemResult.Success = false;
                itemResult.ErrorMessage = ex.Message;
                result.FailedCount++;
            }

            batchOperation.Items.Add(operationItem);
            result.Items.Add(itemResult);
        }

        batchOperation.Status = result.FailedCount == 0
            ? OperationStatus.Success
            : result.SuccessCount == 0
                ? OperationStatus.Failed
                : OperationStatus.PartialSuccess;

        batchOperation.Summary = $"共{result.TotalCount}条，成功{result.SuccessCount}条，失败{result.FailedCount}条";
        result.Summary = batchOperation.Summary;

        await _unitOfWork.BatchOperations.AddAsync(batchOperation);
        await _unitOfWork.SaveChangesAsync();

        if (_hubContext != null && updatedAlerts.Count > 0)
        {
            foreach (var alert in updatedAlerts)
            {
                await _hubContext.Clients.All.SendAsync("ReceiveAlert", alert);
            }
        }

        return result;
    }

    public async Task<BatchOperationResultDto> BatchUpdateOrderStatusAsync(
        IEnumerable<Guid> orderIds,
        OrderStatus newStatus,
        Guid? operatedBy = null)
    {
        var idList = orderIds.ToList();
        var result = new BatchOperationResultDto
        {
            TotalCount = idList.Count,
            BatchOperationId = Guid.NewGuid()
        };

        var batchOperation = new BatchOperation
        {
            Id = result.BatchOperationId,
            OperationType = $"BatchUpdateOrderStatus-{newStatus}",
            OperatedAt = DateTime.Now,
            OperatedBy = operatedBy,
            Status = OperationStatus.Success
        };

        foreach (var orderId in idList)
        {
            var itemResult = new BatchOperationItemResultDto { EntityId = orderId };
            var operationItem = new BatchOperationItem
            {
                Id = Guid.NewGuid(),
                BatchOperationId = batchOperation.Id,
                EntityType = nameof(Order),
                EntityId = orderId
            };

            try
            {
                var order = await _unitOfWork.Orders.GetByIdAsync(orderId);
                if (order == null)
                {
                    throw new KeyNotFoundException($"订单记录 {orderId} 不存在");
                }

                order.Status = newStatus;
                if (newStatus == OrderStatus.Fulfilled)
                {
                    order.DeliveryDate = DateTime.Now;
                }

                _unitOfWork.Orders.Update(order);

                operationItem.Success = true;
                itemResult.Success = true;
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                operationItem.Success = false;
                operationItem.ErrorMessage = ex.Message;
                itemResult.Success = false;
                itemResult.ErrorMessage = ex.Message;
                result.FailedCount++;
            }

            batchOperation.Items.Add(operationItem);
            result.Items.Add(itemResult);
        }

        batchOperation.Status = result.FailedCount == 0
            ? OperationStatus.Success
            : result.SuccessCount == 0
                ? OperationStatus.Failed
                : OperationStatus.PartialSuccess;

        batchOperation.Summary = $"共{result.TotalCount}条，成功{result.SuccessCount}条，失败{result.FailedCount}条";
        result.Summary = batchOperation.Summary;

        await _unitOfWork.BatchOperations.AddAsync(batchOperation);
        await _unitOfWork.SaveChangesAsync();

        return result;
    }

    public async Task<BatchOperationResultDto> RetryFailedItemsAsync(Guid batchOperationId)
    {
        var batchOperation = await _context.BatchOperations
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == batchOperationId);

        if (batchOperation == null)
        {
            throw new KeyNotFoundException($"批量操作记录 {batchOperationId} 不存在");
        }

        var failedItems = batchOperation.Items.Where(i => !i.Success).ToList();
        var result = new BatchOperationResultDto
        {
            TotalCount = failedItems.Count,
            BatchOperationId = Guid.NewGuid()
        };

        var retryBatch = new BatchOperation
        {
            Id = result.BatchOperationId,
            OperationType = $"Retry-{batchOperation.OperationType}",
            OperatedAt = DateTime.Now,
            OperatedBy = batchOperation.OperatedBy,
            Status = OperationStatus.Success
        };

        var updatedAlerts = new List<Alert>();

        foreach (var failedItem in failedItems)
        {
            var itemResult = new BatchOperationItemResultDto { EntityId = failedItem.EntityId };
            var operationItem = new BatchOperationItem
            {
                Id = Guid.NewGuid(),
                BatchOperationId = retryBatch.Id,
                EntityType = failedItem.EntityType,
                EntityId = failedItem.EntityId,
                RetryCount = failedItem.RetryCount + 1
            };

            failedItem.RetryCount++;
            _context.BatchOperationItems.Update(failedItem);

            try
            {
                switch (failedItem.EntityType)
                {
                    case nameof(ApplicationMaterial):
                        var material = await _unitOfWork.ApplicationMaterials.GetByIdAsync(failedItem.EntityId!.Value);
                        if (material == null)
                            throw new KeyNotFoundException($"农资材料记录 {failedItem.EntityId} 不存在");
                        material.ApplicationDate = DateTime.Now;
                        _unitOfWork.ApplicationMaterials.Update(material);
                        break;

                    case nameof(Alert):
                        var alert = await _unitOfWork.Alerts.GetByIdAsync(failedItem.EntityId!.Value);
                        if (alert == null)
                            throw new KeyNotFoundException($"告警记录 {failedItem.EntityId} 不存在");
                        updatedAlerts.Add(alert);
                        break;

                    case nameof(Order):
                        var order = await _unitOfWork.Orders.GetByIdAsync(failedItem.EntityId!.Value);
                        if (order == null)
                            throw new KeyNotFoundException($"订单记录 {failedItem.EntityId} 不存在");
                        _unitOfWork.Orders.Update(order);
                        break;

                    default:
                        throw new NotSupportedException($"不支持的实体类型: {failedItem.EntityType}");
                }

                operationItem.Success = true;
                itemResult.Success = true;
                result.SuccessCount++;
            }
            catch (Exception ex)
            {
                operationItem.Success = false;
                operationItem.ErrorMessage = ex.Message;
                itemResult.Success = false;
                itemResult.ErrorMessage = ex.Message;
                result.FailedCount++;
            }

            retryBatch.Items.Add(operationItem);
            result.Items.Add(itemResult);
        }

        retryBatch.Status = result.FailedCount == 0
            ? OperationStatus.Success
            : result.SuccessCount == 0
                ? OperationStatus.Failed
                : OperationStatus.PartialSuccess;

        retryBatch.Summary = $"共{result.TotalCount}条，成功{result.SuccessCount}条，失败{result.FailedCount}条";
        result.Summary = retryBatch.Summary;

        await _unitOfWork.BatchOperations.AddAsync(retryBatch);
        await _unitOfWork.SaveChangesAsync();

        if (_hubContext != null && updatedAlerts.Count > 0)
        {
            foreach (var alert in updatedAlerts)
            {
                await _hubContext.Clients.All.SendAsync("ReceiveAlert", alert);
            }
        }

        return result;
    }
}
