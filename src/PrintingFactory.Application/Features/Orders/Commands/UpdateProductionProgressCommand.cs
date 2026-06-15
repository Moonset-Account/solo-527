
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Orders.Commands;

public class UpdateProductionProgressCommand : IRequest<ProductionProgressDto>
{
    public UpdateProductionProgressDto Progress { get; set; } = new();
}

public class UpdateProductionProgressCommandHandler : IRequestHandler<UpdateProductionProgressCommand, ProductionProgressDto>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;

    public UpdateProductionProgressCommandHandler(PrintingFactoryDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<ProductionProgressDto> Handle(UpdateProductionProgressCommand request, CancellationToken cancellationToken)
    {
        var progress = await _context.ProductionProgresses
            .Include(p => p.ProductionNode)
            .Include(p => p.Equipment)
            .Include(p => p.Order)
            .FirstOrDefaultAsync(p => p.Id == request.Progress.Id, cancellationToken);

        if (progress == null)
            throw new KeyNotFoundException($"Production progress with id {request.Progress.Id} not found");

        var previousStatus = progress.Status;
        
        progress.Status = request.Progress.Status;
        progress.StartTime = request.Progress.StartTime;
        progress.EndTime = request.Progress.EndTime;
        progress.Operator = request.Progress.Operator;
        progress.Remarks = request.Progress.Remarks;
        progress.UpdatedAt = DateTime.UtcNow;

        if (request.Progress.EquipmentId.HasValue && request.Progress.EquipmentId != progress.EquipmentId)
        {
            if (progress.EquipmentId.HasValue)
            {
                var oldEquipment = await _context.Equipment.FindAsync(new object[] { progress.EquipmentId.Value }, cancellationToken);
                if (oldEquipment != null && oldEquipment.Status == EquipmentStatus.InUse)
                {
                    oldEquipment.Status = EquipmentStatus.Idle;
                    oldEquipment.UpdatedAt = DateTime.UtcNow;
                }

                var oldAssignment = await _context.EquipmentAssignments
                    .FirstOrDefaultAsync(e => 
                        e.OrderId == progress.OrderId && 
                        e.EquipmentId == progress.EquipmentId.Value &&
                        e.ReleaseTime == null, 
                        cancellationToken);
                
                if (oldAssignment != null)
                {
                    oldAssignment.ReleaseTime = DateTime.UtcNow;
                }
            }

            var newEquipment = await _context.Equipment.FindAsync(new object[] { request.Progress.EquipmentId.Value }, cancellationToken);
            if (newEquipment != null)
            {
                newEquipment.Status = EquipmentStatus.InUse;
                newEquipment.UpdatedAt = DateTime.UtcNow;

                _context.EquipmentAssignments.Add(new EquipmentAssignment
                {
                    OrderId = progress.OrderId,
                    EquipmentId = request.Progress.EquipmentId.Value,
                    ProductionNodeId = progress.ProductionNodeId,
                    Operator = request.Progress.Operator,
                    Remarks = request.Progress.Remarks
                });
            }

            progress.EquipmentId = request.Progress.EquipmentId;
            await _cacheService.RemoveAsync($"equipment:status:{request.Progress.EquipmentId}");
        }

        if (request.Progress.Status == ProductionStatus.Completed && 
            previousStatus != ProductionStatus.Completed && 
            progress.EquipmentId.HasValue)
        {
            var equipment = await _context.Equipment.FindAsync(new object[] { progress.EquipmentId.Value }, cancellationToken);
            if (equipment != null && equipment.Status == EquipmentStatus.InUse)
            {
                equipment.Status = EquipmentStatus.Idle;
                equipment.UpdatedAt = DateTime.UtcNow;
            }

            var assignment = await _context.EquipmentAssignments
                .FirstOrDefaultAsync(e => 
                    e.OrderId == progress.OrderId && 
                    e.EquipmentId == progress.EquipmentId.Value &&
                    e.ReleaseTime == null, 
                    cancellationToken);
            
            if (assignment != null)
            {
                assignment.ReleaseTime = DateTime.UtcNow;
            }

            await _cacheService.RemoveAsync($"equipment:status:{progress.EquipmentId}");
        }

        await UpdateOrderStatus(progress.OrderId, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);

        await _cacheService.RemoveAsync($"order:{progress.OrderId}");
        await _cacheService.RemoveAsync("orders:list");

        return new ProductionProgressDto
        {
            Id = progress.Id,
            OrderId = progress.OrderId,
            ProductionNodeId = progress.ProductionNodeId,
            ProductionNodeName = progress.ProductionNode != null ? progress.ProductionNode.Name : string.Empty,
            Status = progress.Status,
            StartTime = progress.StartTime,
            EndTime = progress.EndTime,
            Operator = progress.Operator,
            Remarks = progress.Remarks,
            EquipmentId = progress.EquipmentId,
            EquipmentName = progress.Equipment != null ? progress.Equipment.Name : null
        };
    }

    private async Task UpdateOrderStatus(int orderId, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.ProductionProgresses)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null) return;

        var progresses = order.ProductionProgresses.ToList();
        var allCompleted = progresses.All(p => p.Status == ProductionStatus.Completed || p.Status == ProductionStatus.Skipped);
        var anyInProgress = progresses.Any(p => p.Status == ProductionStatus.InProgress);
        var anyStarted = progresses.Any(p => p.Status != ProductionStatus.NotStarted);

        if (allCompleted)
        {
            order.Status = OrderStatus.QualityInspecting;
        }
        else if (anyInProgress || anyStarted)
        {
            order.Status = OrderStatus.InProduction;
        }

        order.UpdatedAt = DateTime.UtcNow;
    }
}
