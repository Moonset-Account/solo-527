
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Batch.Commands;

public class RetryBatchItemCommand : IRequest<BatchOperationItemDto>
{
    public int BatchItemId { get; set; }
    public BatchOperationType OperationType { get; set; }
}

public class RetryBatchItemCommandHandler : IRequestHandler<RetryBatchItemCommand, BatchOperationItemDto>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;
    private readonly IMediator _mediator;

    public RetryBatchItemCommandHandler(
        PrintingFactoryDbContext context, 
        ICacheService cacheService,
        IMediator mediator)
    {
        _context = context;
        _cacheService = cacheService;
        _mediator = mediator;
    }

    public async Task<BatchOperationItemDto> Handle(RetryBatchItemCommand request, CancellationToken cancellationToken)
    {
        var batchItem = await _context.BatchOperationItems
            .Include(b => b.Order)
            .FirstOrDefaultAsync(b => b.Id == request.BatchItemId, cancellationToken);

        if (batchItem == null)
            throw new KeyNotFoundException($"Batch item {request.BatchItemId} not found");

        if (!batchItem.CanRetry)
            throw new InvalidOperationException($"Batch item {request.BatchItemId} cannot be retried");

        if (batchItem.Order == null)
            throw new InvalidOperationException($"Associated order not found");

        batchItem.Status = BatchItemStatus.Processing;
        batchItem.RetryCount++;

        try
        {
            var command = new ExecuteBatchOperationCommand
            {
                Request = new BatchProcessRequest
                {
                    OperationName = $"Retry_{request.OperationType}",
                    Operator = "System",
                    OrderIds = new List<int> { batchItem.OrderId },
                    OperationType = request.OperationType
                }
            };

            await _mediator.Send(command, cancellationToken);

            batchItem.Status = BatchItemStatus.Success;
            batchItem.ProcessedAt = DateTime.UtcNow;
            batchItem.ErrorMessage = null;
        }
        catch (Exception ex)
        {
            batchItem.Status = BatchItemStatus.Failed;
            batchItem.ErrorMessage = ex.Message;
            batchItem.ProcessedAt = DateTime.UtcNow;
            if (batchItem.RetryCount >= 3)
            {
                batchItem.CanRetry = false;
            }
        }

        await _context.SaveChangesAsync(cancellationToken);

        await UpdateBatchOperationStatus(batchItem.BatchOperationId, cancellationToken);

        await _cacheService.RemoveAsync("orders:list");

        return new BatchOperationItemDto
        {
            Id = batchItem.Id,
            OrderId = batchItem.OrderId,
            OrderNo = batchItem.Order != null ? batchItem.Order.OrderNo : string.Empty,
            Status = batchItem.Status,
            ErrorMessage = batchItem.ErrorMessage,
            CanRetry = batchItem.CanRetry,
            RetryCount = batchItem.RetryCount,
            ProcessedAt = batchItem.ProcessedAt
        };
    }

    private async Task UpdateBatchOperationStatus(int batchOperationId, CancellationToken cancellationToken)
    {
        var batchOperation = await _context.BatchOperations
            .Include(b => b.Items)
            .FirstOrDefaultAsync(b => b.Id == batchOperationId, cancellationToken);

        if (batchOperation == null) return;

        batchOperation.SuccessCount = batchOperation.Items.Count(i => i.Status == BatchItemStatus.Success);
        batchOperation.FailedCount = batchOperation.Items.Count(i => i.Status == BatchItemStatus.Failed);
        
        if (batchOperation.FailedCount == 0)
            batchOperation.Status = BatchOperationStatus.Completed;
        else if (batchOperation.SuccessCount > 0)
            batchOperation.Status = BatchOperationStatus.PartiallyCompleted;

        await _context.SaveChangesAsync(cancellationToken);
    }
}
