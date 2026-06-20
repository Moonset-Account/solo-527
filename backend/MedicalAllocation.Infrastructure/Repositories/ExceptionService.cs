using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;
using AutoMapper;

namespace MedicalAllocation.Infrastructure.Repositories;

public class ExceptionService : IExceptionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ExceptionService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ExceptionRecordDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var record = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        return record == null ? null : MapToDTO(record);
    }

    public async Task<IEnumerable<ExceptionRecordDTO>> GetAllAsync(ExceptionQueryDTO? query = null, CancellationToken cancellationToken = default)
    {
        var records = await _unitOfWork.ExceptionRecords.GetAllAsync();

        if (query != null)
        {
            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                records = records.Where(r =>
                    r.RecordNumber.Contains(query.Keyword) ||
                    r.Description.Contains(query.Keyword) ||
                    r.Title.Contains(query.Keyword));
            }

            if (query.ExceptionType.HasValue)
            {
                records = records.Where(r => r.ExceptionType == query.ExceptionType.Value);
            }

            if (query.RiskLevel.HasValue)
            {
                records = records.Where(r => r.RiskLevel == query.RiskLevel.Value);
            }

            if (query.IsResolved.HasValue)
            {
                records = records.Where(r => r.IsResolved == query.IsResolved.Value);
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

    public async Task<ExceptionRecordDTO> CreateAsync(ExceptionCreateDTO dto, CancellationToken cancellationToken = default)
    {
        var record = new ExceptionRecord
        {
            RecordNumber = $"EX{DateTime.Now:yyyyMMddHHmmss}{Random.Shared.Next(1000, 9999)}",
            ExceptionType = dto.ExceptionType,
            AllocationRequestId = dto.AllocationRequestId,
            SupplierReplyId = dto.SupplierReplyId,
            MedicineId = dto.MedicineId,
            SupplierId = dto.SupplierId,
            Title = dto.Title,
            Description = dto.Description,
            RiskLevel = dto.RiskLevel,
            DelayReason = dto.DelayReason,
            ExpectedDate = dto.ExpectedDate,
            ActualDate = dto.ActualDate,
            ResponsibleUserId = dto.ResponsibleUserId,
            CreatedByUserId = dto.CreatedByUserId,
            IsResolved = false,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        await _unitOfWork.ExceptionRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return MapToDTO(record);
    }

    public async Task<ExceptionRecordDTO?> ResolveAsync(ExceptionResolveDTO dto, CancellationToken cancellationToken = default)
    {
        var record = await _unitOfWork.ExceptionRecords.GetByIdAsync(dto.ExceptionRecordId);
        if (record == null) return null;

        record.IsResolved = true;
        record.ResolutionNotes = dto.ResolutionNotes;
        record.ResolvedAt = DateTime.Now;
        record.ResolvedByUserId = dto.ResolvedByUserId;
        record.ProcessingDurationHours = dto.ProcessingDurationHours ?? (int)Math.Round((DateTime.Now - record.CreatedAt).TotalHours);
        record.UpdatedAt = DateTime.Now;

        await _unitOfWork.ExceptionRecords.UpdateAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return MapToDTO(record);
    }

    public async Task<ExceptionRecordDTO?> AssignResponsibleAsync(int exceptionId, int responsibleUserId, int assignedByUserId, CancellationToken cancellationToken = default)
    {
        var record = await _unitOfWork.ExceptionRecords.GetByIdAsync(exceptionId);
        if (record == null) return null;

        var user = await _unitOfWork.Users.GetByIdAsync(responsibleUserId);
        if (user == null)
            throw new InvalidOperationException($"用户 {responsibleUserId} 不存在");

        record.ResponsibleUserId = responsibleUserId;
        record.UpdatedAt = DateTime.Now;

        await _unitOfWork.ExceptionRecords.UpdateAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return MapToDTO(record);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var record = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (record == null) return false;

        await _unitOfWork.ExceptionRecords.DeleteAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetOpenCountAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.ExceptionRecords.CountAsync(r => !r.IsResolved);
    }

    public async Task<IEnumerable<ExceptionRecordDTO>> GetOpenExceptionsAsync(int? responsibleUserId = null, CancellationToken cancellationToken = default)
    {
        var records = await _unitOfWork.ExceptionRecords
            .FindAsync(r => !r.IsResolved &&
                            (!responsibleUserId.HasValue || r.ResponsibleUserId == responsibleUserId.Value));
        return records.Select(MapToDTO);
    }

    private static ExceptionRecordDTO MapToDTO(ExceptionRecord r)
    {
        return new ExceptionRecordDTO
        {
            Id = r.Id,
            RecordNumber = r.RecordNumber,
            ExceptionType = r.ExceptionType,
            AllocationRequestId = r.AllocationRequestId,
            AllocationRequestNumber = r.AllocationRequest?.RequestNumber,
            SupplierReplyId = r.SupplierReplyId,
            SupplierName = r.Supplier?.Name,
            MedicineId = r.MedicineId,
            MedicineName = r.Medicine?.Name,
            MedicineCode = r.Medicine?.Code,
            SupplierId = r.SupplierId,
            SupplierCode = r.Supplier?.Code,
            Title = r.Title,
            Description = r.Description,
            RiskLevel = r.RiskLevel,
            DelayReason = r.DelayReason,
            ExpectedDate = r.ExpectedDate,
            ActualDate = r.ActualDate,
            ProcessingDurationHours = r.ProcessingDurationHours,
            ResponsibleUserId = r.ResponsibleUserId,
            ResponsibleUserName = r.ResponsibleUser?.Username,
            ResponsibleUserRealName = r.ResponsibleUser?.RealName,
            CreatedByUserId = r.CreatedByUserId,
            CreatedByUserName = r.CreatedByUser?.RealName,
            IsResolved = r.IsResolved,
            ResolutionNotes = r.ResolutionNotes,
            ResolvedAt = r.ResolvedAt,
            ResolvedByUserId = r.ResolvedByUserId,
            CreatedAt = r.CreatedAt,
            UpdatedAt = r.UpdatedAt
        };
    }
}
