using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;
using AutoMapper;

namespace MedicalAllocation.Infrastructure.Repositories;

public class DiscrepancyService : IDiscrepancyService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public DiscrepancyService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<DiscrepancyRecordDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var record = await _unitOfWork.DiscrepancyRecords.GetByIdAsync(id);
        return record == null ? null : MapToDTO(record);
    }

    public async Task<IEnumerable<DiscrepancyRecordDTO>> GetAllAsync(DiscrepancyQueryDTO? query = null, CancellationToken cancellationToken = default)
    {
        var records = await _unitOfWork.DiscrepancyRecords.GetAllAsync();

        if (query != null)
        {
            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                records = records.Where(r =>
                    r.RecordNumber.Contains(query.Keyword) ||
                    (!string.IsNullOrEmpty(r.Description) && r.Description.Contains(query.Keyword)) ||
                    (r.AllocationRequest != null && r.AllocationRequest.RequestNumber.Contains(query.Keyword))
                );
            }

            if (query.DiscrepancyType.HasValue)
            {
                records = records.Where(r => r.DiscrepancyType == query.DiscrepancyType.Value);
            }

            if (query.Status.HasValue)
            {
                records = records.Where(r => r.Status == query.Status.Value);
            }

            if (query.ResponsibleUserId.HasValue)
            {
                records = records.Where(r => r.ResponsibleUserId == query.ResponsibleUserId.Value);
            }

            if (query.StartDate.HasValue)
            {
                records = records.Where(r => r.CreatedAt >= query.StartDate.Value);
            }

            if (query.EndDate.HasValue)
            {
                records = records.Where(r => r.CreatedAt <= query.EndDate.Value);
            }
        }

        return records.Select(MapToDTO);
    }

    public async Task<DiscrepancyRecordDTO> CreateFromAllocationAsync(int allocationId, DiscrepancyRecordDTO dto, int createdByUserId, CancellationToken cancellationToken = default)
    {
        var allocation = await _unitOfWork.AllocationRequests.GetByIdAsync(allocationId);
        if (allocation == null)
            throw new InvalidOperationException($"调拨单 {allocationId} 不存在");

        var record = new DiscrepancyRecord
        {
            RecordNumber = $"DR{DateTime.Now:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}",
            AllocationRequestId = allocationId,
            DiscrepancyType = dto.DiscrepancyType,
            ExpectedQuantity = dto.ExpectedQuantity,
            ActualQuantity = dto.ActualQuantity,
            DifferenceQuantity = dto.ExpectedQuantity - dto.ActualQuantity,
            Description = dto.Description,
            Status = DiscrepancyStatus.Open,
            ResponsibleUserId = dto.ResponsibleUserId,
            InvestigationResult = dto.InvestigationResult,
            ResolutionAction = dto.ResolutionAction,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        if (allocation.ReceiptStatus != ReceiptStatus.Discrepancy)
        {
            allocation.ReceiptStatus = ReceiptStatus.Discrepancy;
            allocation.UpdatedAt = DateTime.Now;
            await _unitOfWork.AllocationRequests.UpdateAsync(allocation);
        }

        await _unitOfWork.DiscrepancyRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return MapToDTO(record);
    }

    public async Task<DiscrepancyRecordDTO?> ResolveAsync(DiscrepancyResolveDTO dto, CancellationToken cancellationToken = default)
    {
        var record = await _unitOfWork.DiscrepancyRecords.GetByIdAsync(dto.DiscrepancyRecordId);
        if (record == null) return null;

        record.Status = dto.Status;
        record.InvestigationResult = dto.InvestigationResult;
        record.ResolutionAction = dto.ResolutionAction;
        record.ResolvedAt = DateTime.Now;
        record.ResolvedByUserId = dto.ResolvedByUserId;
        record.UpdatedAt = DateTime.Now;

        await _unitOfWork.DiscrepancyRecords.UpdateAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return MapToDTO(record);
    }

    public async Task<DiscrepancyRecordDTO?> AssignResponsibleAsync(int discrepancyId, int responsibleUserId, int assignedByUserId, CancellationToken cancellationToken = default)
    {
        var record = await _unitOfWork.DiscrepancyRecords.GetByIdAsync(discrepancyId);
        if (record == null) return null;

        var user = await _unitOfWork.Users.GetByIdAsync(responsibleUserId);
        if (user == null)
            throw new InvalidOperationException($"用户 {responsibleUserId} 不存在");

        record.ResponsibleUserId = responsibleUserId;
        if (record.Status == DiscrepancyStatus.Open)
        {
            record.Status = DiscrepancyStatus.Investigating;
        }
        record.UpdatedAt = DateTime.Now;

        await _unitOfWork.DiscrepancyRecords.UpdateAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return MapToDTO(record);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var record = await _unitOfWork.DiscrepancyRecords.GetByIdAsync(id);
        if (record == null) return false;

        await _unitOfWork.DiscrepancyRecords.DeleteAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetOpenCountAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.DiscrepancyRecords.CountAsync(r => r.Status != DiscrepancyStatus.Resolved);
    }

    public async Task<IEnumerable<DiscrepancyRecordDTO>> GetOpenDiscrepanciesAsync(int? responsibleUserId = null, CancellationToken cancellationToken = default)
    {
        var records = await _unitOfWork.DiscrepancyRecords
            .FindAsync(r => r.Status != DiscrepancyStatus.Resolved &&
                            (!responsibleUserId.HasValue || r.ResponsibleUserId == responsibleUserId.Value));
        return records.Select(MapToDTO);
    }

    private static DiscrepancyRecordDTO MapToDTO(DiscrepancyRecord r)
    {
        return new DiscrepancyRecordDTO
        {
            Id = r.Id,
            RecordNumber = r.RecordNumber,
            AllocationRequestId = r.AllocationRequestId,
            AllocationRequestNumber = r.AllocationRequest != null ? r.AllocationRequest.RequestNumber : null,
            SourceWarehouseName = r.AllocationRequest != null && r.AllocationRequest.SourceWarehouse != null ? r.AllocationRequest.SourceWarehouse.Name : null,
            TargetWarehouseName = r.AllocationRequest != null && r.AllocationRequest.TargetWarehouse != null ? r.AllocationRequest.TargetWarehouse.Name : null,
            MedicineName = r.AllocationRequest != null && r.AllocationRequest.Medicine != null ? r.AllocationRequest.Medicine.Name : null,
            MedicineCode = r.AllocationRequest != null && r.AllocationRequest.Medicine != null ? r.AllocationRequest.Medicine.Code : null,
            DiscrepancyType = r.DiscrepancyType,
            ExpectedQuantity = r.ExpectedQuantity,
            ActualQuantity = r.ActualQuantity,
            DifferenceQuantity = r.DifferenceQuantity,
            Description = r.Description,
            Status = r.Status,
            ResponsibleUserId = r.ResponsibleUserId,
            ResponsibleUserName = r.ResponsibleUser != null ? r.ResponsibleUser.Username : null,
            ResponsibleUserRealName = r.ResponsibleUser != null ? r.ResponsibleUser.RealName : null,
            InvestigationResult = r.InvestigationResult,
            ResolutionAction = r.ResolutionAction,
            ResolvedAt = r.ResolvedAt,
            ResolvedByUserId = r.ResolvedByUserId,
            ResolvedByUserName = r.ResolvedByUser != null ? r.ResolvedByUser.RealName : null,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}
