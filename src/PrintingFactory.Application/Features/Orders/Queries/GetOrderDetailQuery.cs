
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Orders.Queries;

public class GetOrderDetailQuery : IRequest<OrderDetailDto?>
{
    public int Id { get; set; }
}

public class GetOrderDetailQueryHandler : IRequestHandler<GetOrderDetailQuery, OrderDetailDto?>
{
    private readonly PrintingFactoryDbContext _context;

    public GetOrderDetailQueryHandler(PrintingFactoryDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDetailDto?> Handle(GetOrderDetailQuery request, CancellationToken cancellationToken)
    {
        var order = await _context.Orders
            .Include(o => o.Store)
            .Include(o => o.ProductionProgresses)
                .ThenInclude(p => p.ProductionNode)
            .Include(o => o.ProductionProgresses)
                .ThenInclude(p => p.Equipment)
            .Include(o => o.QualityInspections)
                .ThenInclude(q => q.QualityIssue)
            .Include(o => o.DeliveryTrackings)
            .Include(o => o.EquipmentAssignments)
                .ThenInclude(e => e.Equipment)
            .Include(o => o.EquipmentAssignments)
                .ThenInclude(e => e.ProductionNode)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);

        if (order == null) return null;

        return new OrderDetailDto
        {
            Id = order.Id,
            OrderNo = order.OrderNo,
            StoreId = order.StoreId,
            StoreName = order.Store != null ? order.Store.Name : string.Empty,
            CustomerName = order.CustomerName,
            CustomerPhone = order.CustomerPhone,
            ProductName = order.ProductName,
            Specifications = order.Specifications,
            Quantity = order.Quantity,
            Unit = order.Unit,
            UnitPrice = order.UnitPrice,
            TotalAmount = order.TotalAmount,
            MaterialRequirements = order.MaterialRequirements,
            SpecialRequirements = order.SpecialRequirements,
            OrderDate = order.OrderDate,
            DeliveryDate = order.DeliveryDate,
            Status = order.Status,
            Remarks = order.Remarks,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt,
            ProductionProgresses = order.ProductionProgresses.Select(p => new ProductionProgressDto
            {
                Id = p.Id,
                OrderId = p.OrderId,
                ProductionNodeId = p.ProductionNodeId,
                ProductionNodeName = p.ProductionNode != null ? p.ProductionNode.Name : string.Empty,
                Status = p.Status,
                StartTime = p.StartTime,
                EndTime = p.EndTime,
                Operator = p.Operator,
                Remarks = p.Remarks,
                EquipmentId = p.EquipmentId,
                EquipmentName = p.Equipment != null ? p.Equipment.Name : null
            }).ToList(),
            QualityInspections = order.QualityInspections.Select(q => new QualityInspectionDto
            {
                Id = q.Id,
                OrderId = q.OrderId,
                Inspector = q.Inspector,
                InspectionDate = q.InspectionDate,
                Result = q.Result,
                InspectedQuantity = q.InspectedQuantity,
                PassedQuantity = q.PassedQuantity,
                FailedQuantity = q.FailedQuantity,
                CheckItems = q.CheckItems,
                Remarks = q.Remarks,
                CreatedAt = q.CreatedAt,
                QualityIssue = q.QualityIssue != null ? new QualityIssueDto
                {
                    Id = q.QualityIssue.Id,
                    QualityInspectionId = q.QualityIssue.QualityInspectionId,
                    AffectedScope = q.QualityIssue.AffectedScope,
                    IssueDescription = q.QualityIssue.IssueDescription,
                    RootCause = q.QualityIssue.RootCause,
                    HandlingPath = q.QualityIssue.HandlingPath,
                    CorrectiveAction = q.QualityIssue.CorrectiveAction,
                    PreventiveAction = q.QualityIssue.PreventiveAction,
                    ReviewNotes = q.QualityIssue.ReviewNotes,
                    Status = q.QualityIssue.Status,
                    Handler = q.QualityIssue.Handler,
                    Reviewer = q.QualityIssue.Reviewer,
                    ResolvedAt = q.QualityIssue.ResolvedAt,
                    CreatedAt = q.QualityIssue.CreatedAt
                } : null
            }).ToList(),
            DeliveryTrackings = order.DeliveryTrackings.Select(d => new DeliveryTrackingDto
            {
                Id = d.Id,
                OrderId = d.OrderId,
                Status = d.Status,
                ScheduledDeliveryDate = d.ScheduledDeliveryDate,
                ActualDeliveryDate = d.ActualDeliveryDate,
                DeliveryMethod = d.DeliveryMethod,
                TrackingNo = d.TrackingNo,
                Receiver = d.Receiver,
                ReceiverPhone = d.ReceiverPhone,
                DeliveryAddress = d.DeliveryAddress,
                Signature = d.Signature,
                Remarks = d.Remarks,
                CreatedAt = d.CreatedAt
            }).ToList(),
            EquipmentAssignments = order.EquipmentAssignments.Select(e => new EquipmentAssignmentDto
            {
                Id = e.Id,
                OrderId = e.OrderId,
                EquipmentId = e.EquipmentId,
                EquipmentName = e.Equipment != null ? e.Equipment.Name : string.Empty,
                ProductionNodeId = e.ProductionNodeId,
                ProductionNodeName = e.ProductionNode != null ? e.ProductionNode.Name : null,
                AssignTime = e.AssignTime,
                ReleaseTime = e.ReleaseTime,
                Operator = e.Operator,
                Remarks = e.Remarks
            }).ToList()
        };
    }
}
