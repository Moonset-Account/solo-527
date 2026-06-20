using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;
using AutoMapper;

namespace MedicalAllocation.Infrastructure.Repositories;

public class AllocationService : IAllocationService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public AllocationService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<AllocationRequestDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(id);
        return allocation == null ? null : _mapper.Map<AllocationRequestDTO>(allocation);
    }

    public async Task<IEnumerable<AllocationRequestDTO>> GetAllAsync(AllocationStatus? status = null, int? warehouseId = null, CancellationToken cancellationToken = default)
    {
        var allocations = await _unitOfWork.AllocationRequests.GetAllAsync();

        if (status.HasValue)
        {
            allocations = allocations.Where(a => a.Status == status.Value);
        }

        if (warehouseId.HasValue)
        {
            allocations = allocations.Where(a => a.SourceWarehouseId == warehouseId.Value || a.TargetWarehouseId == warehouseId.Value);
        }

        return _mapper.Map<IEnumerable<AllocationRequestDTO>>(allocations);
    }

    public async Task<AllocationRequestDTO> CreateAsync(AllocationCreateDTO dto, CancellationToken cancellationToken = default)
    {
        var allocation = _mapper.Map<AllocationRequest>(dto);
        allocation.RequestNumber = $"AL{DateTime.Now:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}";
        allocation.Status = AllocationStatus.Pending;
        allocation.CreatedAt = DateTime.Now;
        allocation.UpdatedAt = DateTime.Now;

        await _unitOfWork.AllocationRequests.AddAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<AllocationRequestDTO>(allocation);
    }

    public async Task<AllocationRequestDTO?> ApproveAsync(AllocationApproveDTO dto, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(dto.AllocationRequestId);
        if (allocation == null) return null;

        allocation.Status = dto.IsApproved ? AllocationStatus.Approved : AllocationStatus.Rejected;
        allocation.ApprovedByUserId = dto.ApprovedByUserId;
        allocation.ApprovedAt = DateTime.Now;
        allocation.Remarks = dto.Remarks;
        allocation.UpdatedAt = DateTime.Now;

        await _unitOfWork.AllocationRequests.UpdateAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<AllocationRequestDTO>(allocation);
    }

    public async Task<AllocationRequestDTO?> MarkInTransitAsync(int allocationId, int userId, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(allocationId);
        if (allocation == null) return null;

        allocation.Status = AllocationStatus.InTransit;
        allocation.UpdatedAt = DateTime.Now;

        await _unitOfWork.AllocationRequests.UpdateAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<AllocationRequestDTO>(allocation);
    }

    public async Task<AllocationRequestDTO?> ReceiveAsync(AllocationReceiveDTO dto, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(dto.AllocationRequestId);
        if (allocation == null) return null;

        allocation.Status = dto.ReceiptStatus == ReceiptStatus.Completed ? AllocationStatus.Completed : AllocationStatus.Completed;
        allocation.ReceiptStatus = dto.ReceiptStatus;
        allocation.ReceiptDate = DateTime.Now;
        allocation.ReceivedByUserId = dto.ReceivedByUserId;
        allocation.ActualDeliveryDate = DateTime.Now;
        allocation.Remarks = dto.Remarks;
        allocation.UpdatedAt = DateTime.Now;

        if (dto.ReceiptStatus == ReceiptStatus.Discrepancy || dto.ReceivedQuantity != allocation.Quantity)
        {
            var discrepancy = new DiscrepancyRecord
            {
                RecordNumber = $"DR{DateTime.Now:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}",
                AllocationRequestId = allocation.Id,
                DiscrepancyType = dto.ReceivedQuantity < allocation.Quantity ? DiscrepancyType.QuantityShort : DiscrepancyType.QuantityOver,
                ExpectedQuantity = allocation.Quantity,
                ActualQuantity = dto.ReceivedQuantity,
                DifferenceQuantity = allocation.Quantity - dto.ReceivedQuantity,
                Description = $"收货数量与预期不符，预期 {allocation.Quantity}，实际 {dto.ReceivedQuantity}",
                Status = DiscrepancyStatus.Open,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now
            };
            await _unitOfWork.DiscrepancyRecords.AddAsync(discrepancy);
        }

        await _unitOfWork.AllocationRequests.UpdateAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<AllocationRequestDTO>(allocation);
    }

    public async Task<AllocationRequestDTO?> CancelAsync(int allocationId, int userId, string? reason = null, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(allocationId);
        if (allocation == null) return null;

        allocation.Status = AllocationStatus.Cancelled;
        allocation.Remarks = reason;
        allocation.UpdatedAt = DateTime.Now;

        await _unitOfWork.AllocationRequests.UpdateAsync(allocation);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<AllocationRequestDTO>(allocation);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(id);
        if (allocation == null) return false;

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
        return _mapper.Map<IEnumerable<AllocationRequestDTO>>(allocations);
    }
}
