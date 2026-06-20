using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;

namespace MedicalAllocation.Application.Services;

public class AllocationService : IAllocationService
{
    private readonly IUnitOfWork _unitOfWork;

    public AllocationService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<AllocationRequestDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(id);
        if (allocation == null) return null;
        return await MapToDTO(allocation);
    }

    public async Task<IEnumerable<AllocationRequestDTO>> GetAllAsync(AllocationStatus? status = null, int? warehouseId = null, CancellationToken cancellationToken = default)
    {
        var allocations = await _unitOfWork.AllocationRequests.GetAllAsync();
        var queryable = allocations.AsQueryable();

        if (status.HasValue)
        {
            queryable = queryable.Where(a => a.Status == status.Value);
        }

        if (warehouseId.HasValue)
        {
            queryable = queryable.Where(a => a.SourceWarehouseId == warehouseId.Value || a.TargetWarehouseId == warehouseId.Value);
        }

        var result = new List<AllocationRequestDTO>();
        foreach (var allocation in queryable.OrderByDescending(a => a.CreatedAt))
        {
            result.Add(await MapToDTO(allocation));
        }
        return result;
    }

    public async Task<AllocationRequestDTO> CreateAsync(AllocationCreateDTO dto, CancellationToken cancellationToken = default)
    {
        var requestNumber = $"AL{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";

        var allocation = new AllocationRequest
        {
            RequestNumber = requestNumber,
            SourceWarehouseId = dto.SourceWarehouseId,
            TargetWarehouseId = dto.TargetWarehouseId,
            MedicineId = dto.MedicineId,
            BatchId = dto.BatchId,
            Quantity = dto.Quantity,
            Reason = dto.Reason,
            Status = AllocationStatus.Pending,
            RequestedByUserId = dto.RequestedByUserId,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            Remarks = dto.Remarks,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        var created = await _unitOfWork.AllocationRequests.AddAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(created);
    }

    public async Task<AllocationRequestDTO?> ApproveAsync(AllocationApproveDTO dto, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(dto.AllocationRequestId);
        if (allocation == null) return null;
        if (allocation.Status != AllocationStatus.Pending) return null;

        allocation.Status = dto.IsApproved ? AllocationStatus.Approved : AllocationStatus.Rejected;
        allocation.ApprovedByUserId = dto.ApprovedByUserId;
        allocation.ApprovedAt = DateTime.Now;
        allocation.Remarks = dto.Remarks ?? allocation.Remarks;
        allocation.UpdatedAt = DateTime.Now;

        await _unitOfWork.AllocationRequests.UpdateAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(allocation);
    }

    public async Task<AllocationRequestDTO?> MarkInTransitAsync(int allocationId, int userId, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(allocationId);
        if (allocation == null) return null;
        if (allocation.Status != AllocationStatus.Approved) return null;

        allocation.Status = AllocationStatus.InTransit;
        allocation.UpdatedAt = DateTime.Now;

        await _unitOfWork.AllocationRequests.UpdateAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(allocation);
    }

    public async Task<AllocationRequestDTO?> ReceiveAsync(AllocationReceiveDTO dto, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(dto.AllocationRequestId);
        if (allocation == null) return null;
        if (allocation.Status != AllocationStatus.InTransit && allocation.Status != AllocationStatus.Approved) return null;

        allocation.Status = AllocationStatus.Completed;
        allocation.ReceiptStatus = dto.ReceiptStatus;
        allocation.ReceiptDate = DateTime.Now;
        allocation.ActualDeliveryDate = DateTime.Now;
        allocation.ReceivedByUserId = dto.ReceivedByUserId;
        allocation.Remarks = dto.Remarks ?? allocation.Remarks;
        allocation.UpdatedAt = DateTime.Now;

        await _unitOfWork.AllocationRequests.UpdateAsync(allocation);

        if (dto.ReceiptStatus == ReceiptStatus.Discrepancy || dto.ReceivedQuantity != allocation.Quantity)
        {
            var discrepancyNumber = $"DR{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";
            var discrepancyType = dto.ReceivedQuantity < allocation.Quantity
                ? DiscrepancyType.QuantityShort
                : DiscrepancyType.QuantityOver;

            await _unitOfWork.DiscrepancyRecords.AddAsync(new DiscrepancyRecord
            {
                RecordNumber = discrepancyNumber,
                AllocationRequestId = allocation.Id,
                DiscrepancyType = discrepancyType,
                ExpectedQuantity = allocation.Quantity,
                ActualQuantity = dto.ReceivedQuantity,
                DifferenceQuantity = Math.Abs(dto.ReceivedQuantity - allocation.Quantity),
                Description = dto.Remarks,
                Status = DiscrepancyStatus.Open,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            });
        }

        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(allocation);
    }

    public async Task<AllocationRequestDTO?> CancelAsync(int allocationId, int userId, string? reason = null, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(allocationId);
        if (allocation == null) return null;
        if (allocation.Status == AllocationStatus.Completed || allocation.Status == AllocationStatus.Cancelled) return null;

        allocation.Status = AllocationStatus.Cancelled;
        allocation.Remarks = reason ?? allocation.Remarks;
        allocation.UpdatedAt = DateTime.Now;

        await _unitOfWork.AllocationRequests.UpdateAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(allocation);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(id);
        if (allocation == null) return false;

        var discrepancies = await _unitOfWork.DiscrepancyRecords.FindAsync(d => d.AllocationRequestId == id);
        foreach (var discrepancy in discrepancies)
        {
            await _unitOfWork.DiscrepancyRecords.DeleteAsync(discrepancy);
        }

        await _unitOfWork.AllocationRequests.DeleteAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetPendingApprovalCountAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.AllocationRequests.CountAsync(a => a.Status == AllocationStatus.Pending);
    }

    public async Task<IEnumerable<AllocationRequestDTO>> GetPendingApprovalAsync(CancellationToken cancellationToken = default)
    {
        var allocations = await _unitOfWork.AllocationRequests.FindAsync(a => a.Status == AllocationStatus.Pending);
        var result = new List<AllocationRequestDTO>();
        foreach (var allocation in allocations.OrderByDescending(a => a.CreatedAt))
        {
            result.Add(await MapToDTO(allocation));
        }
        return result;
    }

    private async Task<AllocationRequestDTO> MapToDTO(AllocationRequest allocation)
    {
        var sourceWarehouse = allocation.SourceWarehouse ?? await _unitOfWork.Warehouses.GetByIdAsync(allocation.SourceWarehouseId);
        var targetWarehouse = allocation.TargetWarehouse ?? await _unitOfWork.Warehouses.GetByIdAsync(allocation.TargetWarehouseId);
        var medicine = allocation.Medicine ?? await _unitOfWork.Medicines.GetByIdAsync(allocation.MedicineId);
        var batch = allocation.BatchId.HasValue
            ? (allocation.Batch ?? await _unitOfWork.MedicineBatches.GetByIdAsync(allocation.BatchId.Value))
            : null;
        var requestedByUser = allocation.RequestedByUser ?? await _unitOfWork.Users.GetByIdAsync(allocation.RequestedByUserId);
        var approvedByUser = allocation.ApprovedByUserId.HasValue
            ? (allocation.ApprovedByUser ?? await _unitOfWork.Users.GetByIdAsync(allocation.ApprovedByUserId.Value))
            : null;
        var receivedByUser = allocation.ReceivedByUserId.HasValue
            ? (allocation.ReceivedByUser ?? await _unitOfWork.Users.GetByIdAsync(allocation.ReceivedByUserId.Value))
            : null;

        return new AllocationRequestDTO
        {
            Id = allocation.Id,
            RequestNumber = allocation.RequestNumber,
            SourceWarehouseId = allocation.SourceWarehouseId,
            SourceWarehouseName = sourceWarehouse?.Name,
            TargetWarehouseId = allocation.TargetWarehouseId,
            TargetWarehouseName = targetWarehouse?.Name,
            MedicineId = allocation.MedicineId,
            MedicineName = medicine?.Name,
            MedicineCode = medicine?.Code,
            BatchId = allocation.BatchId,
            BatchNumber = batch?.BatchNumber,
            Quantity = allocation.Quantity,
            Reason = allocation.Reason,
            Status = allocation.Status,
            RequestedByUserId = allocation.RequestedByUserId,
            RequestedByUserName = requestedByUser?.RealName,
            ApprovedByUserId = allocation.ApprovedByUserId,
            ApprovedByUserName = approvedByUser?.RealName,
            ApprovedAt = allocation.ApprovedAt,
            ExpectedDeliveryDate = allocation.ExpectedDeliveryDate,
            ActualDeliveryDate = allocation.ActualDeliveryDate,
            ReceiptStatus = allocation.ReceiptStatus,
            ReceiptDate = allocation.ReceiptDate,
            ReceivedByUserId = allocation.ReceivedByUserId,
            ReceivedByUserName = receivedByUser?.RealName,
            Remarks = allocation.Remarks,
            CreatedAt = allocation.CreatedAt,
            UpdatedAt = allocation.UpdatedAt
        };
    }
}
