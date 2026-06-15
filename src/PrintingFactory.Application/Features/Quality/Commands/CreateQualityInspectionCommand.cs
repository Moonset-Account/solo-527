
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Quality.Commands;

public class CreateQualityInspectionCommand : IRequest<QualityInspectionDto>
{
    public CreateQualityInspectionDto Inspection { get; set; } = new();
}

public class CreateQualityInspectionCommandHandler : IRequestHandler<CreateQualityInspectionCommand, QualityInspectionDto>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;

    public CreateQualityInspectionCommandHandler(PrintingFactoryDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<QualityInspectionDto> Handle(CreateQualityInspectionCommand request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders.FindAsync(new object[] { request.Inspection.OrderId }, cancellationToken);
        if (order == null)
            throw new KeyNotFoundException($"Order with id {request.Inspection.OrderId} not found");

        var inspection = new QualityInspection
        {
            OrderId = request.Inspection.OrderId,
            Inspector = request.Inspection.Inspector,
            InspectionDate = request.Inspection.InspectionDate,
            Result = request.Inspection.Result,
            InspectedQuantity = request.Inspection.InspectedQuantity,
            PassedQuantity = request.Inspection.PassedQuantity,
            FailedQuantity = request.Inspection.FailedQuantity,
            CheckItems = request.Inspection.CheckItems,
            Remarks = request.Inspection.Remarks
        };

        _context.QualityInspections.Add(inspection);

        if (request.Inspection.Result == InspectionResult.Fail || 
            request.Inspection.Result == InspectionResult.PartialPass)
        {
            order.Status = OrderStatus.QualityFailed;
        }
        else if (request.Inspection.Result == InspectionResult.Pass)
        {
            order.Status = OrderStatus.Completed;
        }

        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        await _cacheService.RemoveAsync($"order:{request.Inspection.OrderId}");
        await _cacheService.RemoveAsync("orders:list");

        return new QualityInspectionDto
        {
            Id = inspection.Id,
            OrderId = inspection.OrderId,
            Inspector = inspection.Inspector,
            InspectionDate = inspection.InspectionDate,
            Result = inspection.Result,
            InspectedQuantity = inspection.InspectedQuantity,
            PassedQuantity = inspection.PassedQuantity,
            FailedQuantity = inspection.FailedQuantity,
            CheckItems = inspection.CheckItems,
            Remarks = inspection.Remarks,
            CreatedAt = inspection.CreatedAt
        };
    }
}
