using ProcessScheduling.Application.DTOs;
using ProcessScheduling.Application.Interfaces;
using ProcessScheduling.Domain.Entities;
using ProcessScheduling.Domain.Interfaces;

namespace ProcessScheduling.Application.Services;

public class WorkOrderService : IWorkOrderService
{
    private readonly IUnitOfWork _unitOfWork;

    public WorkOrderService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<IEnumerable<WorkOrderDto>> GetAllAsync()
    {
        var workOrders = await _unitOfWork.WorkOrders.GetAllAsync();
        return workOrders.Select(MapToDto);
    }

    public async Task<WorkOrderDto?> GetByIdAsync(Guid id)
    {
        var workOrder = await _unitOfWork.WorkOrders.GetByIdAsync(id);
        return workOrder == null ? null : MapToDto(workOrder);
    }

    public async Task<WorkOrderDto> CreateAsync(WorkOrderDto dto)
    {
        var workOrder = new WorkOrder
        {
            Code = dto.Code,
            ProductName = dto.ProductName,
            ProductCode = dto.ProductCode,
            PlannedQuantity = dto.PlannedQuantity,
            PlannedStartTime = dto.PlannedStartTime,
            PlannedEndTime = dto.PlannedEndTime,
            AssignedEquipmentId = dto.AssignedEquipmentId,
            AssignedShiftId = dto.AssignedShiftId,
            Remarks = dto.Remarks
        };

        var result = await _unitOfWork.WorkOrders.AddAsync(workOrder);
        await _unitOfWork.SaveChangesAsync();
        return MapToDto(result);
    }

    public async Task UpdateAsync(WorkOrderDto dto)
    {
        var workOrder = await _unitOfWork.WorkOrders.GetByIdAsync(dto.Id);
        if (workOrder == null)
            throw new KeyNotFoundException($"工单 {dto.Id} 不存在");

        workOrder.Code = dto.Code;
        workOrder.ProductName = dto.ProductName;
        workOrder.ProductCode = dto.ProductCode;
        workOrder.PlannedQuantity = dto.PlannedQuantity;
        workOrder.PlannedStartTime = dto.PlannedStartTime;
        workOrder.PlannedEndTime = dto.PlannedEndTime;
        workOrder.AssignedEquipmentId = dto.AssignedEquipmentId;
        workOrder.AssignedShiftId = dto.AssignedShiftId;
        workOrder.Remarks = dto.Remarks;
        workOrder.UpdatedAt = DateTime.UtcNow;

        await _unitOfWork.SaveChangesAsync();
    }

    private static WorkOrderDto MapToDto(WorkOrder workOrder)
    {
        return new WorkOrderDto
        {
            Id = workOrder.Id,
            Code = workOrder.Code,
            ProductName = workOrder.ProductName,
            ProductCode = workOrder.ProductCode,
            PlannedQuantity = workOrder.PlannedQuantity,
            CompletedQuantity = workOrder.CompletedQuantity,
            DefectiveQuantity = workOrder.DefectiveQuantity,
            PlannedStartTime = workOrder.PlannedStartTime,
            PlannedEndTime = workOrder.PlannedEndTime,
            ActualStartTime = workOrder.ActualStartTime,
            ActualEndTime = workOrder.ActualEndTime,
            AssignedEquipmentId = workOrder.AssignedEquipmentId,
            EquipmentName = workOrder.AssignedEquipment?.Name,
            AssignedShiftId = workOrder.AssignedShiftId,
            ShiftName = workOrder.AssignedShift?.Name,
            Remarks = workOrder.Remarks
        };
    }
}
