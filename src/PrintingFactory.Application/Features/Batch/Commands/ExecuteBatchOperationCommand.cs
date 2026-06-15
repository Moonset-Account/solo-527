
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Batch.Commands;

public class ExecuteBatchOperationCommand : IRequest<BatchProcessResult>
{
    public BatchProcessRequest Request { get; set; } = new();
}

public class ExecuteBatchOperationCommandHandler : IRequestHandler<ExecuteBatchOperationCommand, BatchProcessResult>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;
    private readonly IMediator _mediator;

    public ExecuteBatchOperationCommandHandler(
        PrintingFactoryDbContext context, 
        ICacheService cacheService,
        IMediator mediator)
    {
        _context = context;
        _cacheService = cacheService;
        _mediator = mediator;
    }

    public async Task<BatchProcessResult> Handle(ExecuteBatchOperationCommand request, CancellationToken cancellationToken)
    {
        var batchOperation = new BatchOperation
        {
            OperationName = request.Request.OperationName,
            Operator = request.Request.Operator,
            TotalItems = request.Request.OrderIds.Count,
            Status = BatchOperationStatus.Confirmed,
            Remarks = request.Request.Remarks
        };

        var orders = await _context.Orders
            .Where(o => request.Request.OrderIds.Contains(o.Id))
            .ToListAsync(cancellationToken);

        foreach (var orderId in request.Request.OrderIds)
        {
            var order = orders.FirstOrDefault(o => o.Id == orderId);
            batchOperation.Items.Add(new BatchOperationItem
            {
                OrderId = orderId,
                Order = order,
                Status = BatchItemStatus.Pending
            });
        }

        _context.BatchOperations.Add(batchOperation);
        await _context.SaveChangesAsync(cancellationToken);

        batchOperation.Status = BatchOperationStatus.Processing;
        batchOperation.CompletedAt = DateTime.UtcNow;

        var failedItems = new List<BatchOperationItemDto>();
        var successCount = 0;
        var failedCount = 0;

        foreach (var item in batchOperation.Items)
        {
            item.Status = BatchItemStatus.Processing;
            try
            {
                await ProcessSingleItem(item.OrderId, request.Request.OperationType, cancellationToken);
                item.Status = BatchItemStatus.Success;
                item.ProcessedAt = DateTime.UtcNow;
                successCount++;
            }
            catch (Exception ex)
            {
                item.Status = BatchItemStatus.Failed;
                item.ErrorMessage = ex.Message;
                item.CanRetry = true;
                item.ProcessedAt = DateTime.UtcNow;
                failedCount++;

                var order = await _context.Orders.FindAsync(new object[] { item.OrderId }, cancellationToken);
                failedItems.Add(new BatchOperationItemDto
                {
                    Id = item.Id,
                    OrderId = item.OrderId,
                    OrderNo = order != null ? order.OrderNo : string.Empty,
                    Status = item.Status,
                    ErrorMessage = item.ErrorMessage,
                    CanRetry = item.CanRetry,
                    RetryCount = item.RetryCount,
                    ProcessedAt = item.ProcessedAt
                });
            }
        }

        batchOperation.SuccessCount = successCount;
        batchOperation.FailedCount = failedCount;
        batchOperation.Status = failedCount == 0 
            ? BatchOperationStatus.Completed 
            : successCount > 0 
                ? BatchOperationStatus.PartiallyCompleted 
                : BatchOperationStatus.Completed;

        await _context.SaveChangesAsync(cancellationToken);

        await _cacheService.RemoveAsync("orders:list");
        await _cacheService.RemoveAsync("stores:summary");
        await _cacheService.RemoveAsync("delivery:reminders");

        return new BatchProcessResult
        {
            BatchOperationId = batchOperation.Id,
            SuccessCount = successCount,
            FailedCount = failedCount,
            FailedItems = failedItems
        };
    }

    private async Task ProcessSingleItem(int orderId, BatchOperationType operationType, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.ProductionProgresses)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null)
            throw new KeyNotFoundException($"Order {orderId} not found");

        switch (operationType)
        {
            case BatchOperationType.StartProduction:
                await StartProduction(order, cancellationToken);
                break;
            case BatchOperationType.CompleteProduction:
                await CompleteProduction(order, cancellationToken);
                break;
            case BatchOperationType.MarkAsDelivered:
                await MarkAsDelivered(order, cancellationToken);
                break;
            case BatchOperationType.UpdateDeliveryDate:
                break;
            case BatchOperationType.ExportOrders:
                break;
            default:
                throw new NotSupportedException($"Operation type {operationType} not supported");
        }
    }

    private async Task StartProduction(Order order, CancellationToken cancellationToken)
    {
        if (order.Status != OrderStatus.Pending)
            throw new InvalidOperationException($"Order {order.OrderNo} is not in Pending status");

        order.Status = OrderStatus.InProduction;
        order.UpdatedAt = DateTime.UtcNow;

        var firstProgress = order.ProductionProgresses
            .OrderBy(p => p.ProductionNode?.SortOrder ?? 0)
            .FirstOrDefault();

        if (firstProgress != null)
        {
            firstProgress.Status = ProductionStatus.InProgress;
            firstProgress.StartTime = DateTime.UtcNow;
            firstProgress.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task CompleteProduction(Order order, CancellationToken cancellationToken)
    {
        if (order.Status != OrderStatus.InProduction)
            throw new InvalidOperationException($"Order {order.OrderNo} is not in Production status");

        foreach (var progress in order.ProductionProgresses)
        {
            if (progress.Status == ProductionStatus.InProgress)
            {
                progress.Status = ProductionStatus.Completed;
                progress.EndTime = DateTime.UtcNow;
                progress.UpdatedAt = DateTime.UtcNow;
            }
            else if (progress.Status == ProductionStatus.NotStarted)
            {
                progress.Status = ProductionStatus.Completed;
                progress.StartTime = DateTime.UtcNow;
                progress.EndTime = DateTime.UtcNow;
                progress.UpdatedAt = DateTime.UtcNow;
            }
        }

        order.Status = OrderStatus.QualityInspecting;
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task MarkAsDelivered(Order order, CancellationToken cancellationToken)
    {
        if (order.Status != OrderStatus.Completed)
            throw new InvalidOperationException($"Order {order.OrderNo} is not in Completed status");

        order.Status = OrderStatus.Delivered;
        order.UpdatedAt = DateTime.UtcNow;

        var deliveryTracking = order.DeliveryTrackings
            .OrderByDescending(d => d.CreatedAt)
            .FirstOrDefault();

        if (deliveryTracking != null)
        {
            deliveryTracking.Status = DeliveryStatus.Delivered;
            deliveryTracking.ActualDeliveryDate = DateTime.UtcNow;
            deliveryTracking.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}
