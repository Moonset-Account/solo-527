using System.Text.Json;
using ArtEduScheduler.API.Data;
using ArtEduScheduler.API.DTOs;
using ArtEduScheduler.API.Models;
using Microsoft.EntityFrameworkCore;

namespace ArtEduScheduler.API.Services;

public interface IBatchOperationService
{
    Task<BatchOperationDto> SaveBatchResultAsync<T>(string operationType, int operatorId, BatchOperationResult<T> result);
    Task<List<BatchOperationDto>> GetBatchOperationsAsync(int? operatorId = null);
    Task<BatchOperationDto?> GetBatchOperationAsync(Guid id);
}

public class BatchOperationService : IBatchOperationService
{
    private readonly AppDbContext _context;

    public BatchOperationService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<BatchOperationDto> SaveBatchResultAsync<T>(string operationType, int operatorId, BatchOperationResult<T> result)
    {
        var operation = new BatchOperation
        {
            Id = Guid.NewGuid(),
            OperationType = operationType,
            OperatorId = operatorId,
            TotalCount = result.TotalCount,
            SuccessCount = result.SuccessCount,
            FailedCount = result.FailedCount,
            FailedItems = result.FailedItems.Count > 0 ? JsonSerializer.Serialize(result.FailedItems) : null,
            Summary = result.Summary,
            Completed = true,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };

        _context.BatchOperations.Add(operation);
        await _context.SaveChangesAsync();

        return new BatchOperationDto
        {
            Id = operation.Id,
            OperationType = operation.OperationType,
            OperatorId = operation.OperatorId,
            OperatorName = (await _context.Users.FindAsync(operatorId))?.RealName ?? string.Empty,
            TotalCount = operation.TotalCount,
            SuccessCount = operation.SuccessCount,
            FailedCount = operation.FailedCount,
            FailedItemsList = result.FailedItems.Count > 0 ? result.FailedItems : null,
            Summary = operation.Summary,
            Completed = operation.Completed,
            CreatedAt = operation.CreatedAt,
            CompletedAt = operation.CompletedAt
        };
    }

    public async Task<List<BatchOperationDto>> GetBatchOperationsAsync(int? operatorId = null)
    {
        var query = _context.BatchOperations.AsQueryable();
        if (operatorId.HasValue) query = query.Where(b => b.OperatorId == operatorId.Value);

        var operations = await query
            .OrderByDescending(b => b.CreatedAt)
            .Include(b => b.Operator)
            .Take(100)
            .ToListAsync();

        return operations.Select(b => new BatchOperationDto
        {
            Id = b.Id,
            OperationType = b.OperationType,
            OperatorId = b.OperatorId,
            OperatorName = b.Operator?.RealName ?? string.Empty,
            TotalCount = b.TotalCount,
            SuccessCount = b.SuccessCount,
            FailedCount = b.FailedCount,
            FailedItemsList = string.IsNullOrEmpty(b.FailedItems) ? null : JsonSerializer.Deserialize<List<BatchFailedItem>>(b.FailedItems!),
            Summary = b.Summary,
            Completed = b.Completed,
            CreatedAt = b.CreatedAt,
            CompletedAt = b.CompletedAt
        }).ToList();
    }

    public async Task<BatchOperationDto?> GetBatchOperationAsync(Guid id)
    {
        var operation = await _context.BatchOperations
            .Include(b => b.Operator)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (operation == null) return null;

        return new BatchOperationDto
        {
            Id = operation.Id,
            OperationType = operation.OperationType,
            OperatorId = operation.OperatorId,
            OperatorName = operation.Operator?.RealName ?? string.Empty,
            TotalCount = operation.TotalCount,
            SuccessCount = operation.SuccessCount,
            FailedCount = operation.FailedCount,
            FailedItemsList = string.IsNullOrEmpty(operation.FailedItems) ? null : JsonSerializer.Deserialize<List<BatchFailedItem>>(operation.FailedItems!),
            Summary = operation.Summary,
            Completed = operation.Completed,
            CreatedAt = operation.CreatedAt,
            CompletedAt = operation.CompletedAt
        };
    }
}
