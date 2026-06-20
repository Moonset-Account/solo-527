using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;

namespace MedicalAllocation.Application.Services;

public class ExceptionService : IExceptionService
{
    private readonly IUnitOfWork _unitOfWork;

    public ExceptionService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ExceptionRecordDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null) return null;
        return await MapToDTO(exception);
    }

    public async Task<IEnumerable<ExceptionRecordDTO>> GetAllAsync(ExceptionQueryDTO? query = null, CancellationToken cancellationToken = default)
    {
        var exceptions = await _unitOfWork.ExceptionRecords.GetAllAsync();
        var queryable = exceptions.AsQueryable();

        if (query != null)
        {
            if (query.ExceptionType.HasValue)
            {
                queryable = queryable.Where(e => e.ExceptionType == query.ExceptionType.Value);
            }

            if (query.RiskLevel.HasValue)
            {
                queryable = queryable.Where(e => e.RiskLevel == query.RiskLevel.Value);
            }

            if (query.IsResolved.HasValue)
            {
                queryable = queryable.Where(e => e.IsResolved == query.IsResolved.Value);
            }

            if (query.ResponsibleUserId.HasValue)
            {
                queryable = queryable.Where(e => e.ResponsibleUserId == query.ResponsibleUserId.Value);
            }

            if (query.StartDate.HasValue)
            {
                queryable = queryable.Where(e => e.CreatedAt >= query.StartDate.Value);
            }

            if (query.EndDate.HasValue)
            {
                queryable = queryable.Where(e => e.CreatedAt <= query.EndDate.Value);
            }
        }

        var result = new List<ExceptionRecordDTO>();
        foreach (var exception in queryable.OrderByDescending(e => e.CreatedAt))
        {
            result.Add(await MapToDTO(exception));
        }

        if (!string.IsNullOrWhiteSpace(query?.Keyword))
        {
            var kw = query.Keyword.Trim().ToLower();
            result = result.Where(r =>
                (r.Title != null && r.Title.ToLower().Contains(kw)) ||
                (r.Description != null && r.Description.ToLower().Contains(kw)) ||
                (r.MedicineName != null && r.MedicineName.ToLower().Contains(kw)) ||
                (r.SupplierName != null && r.SupplierName.ToLower().Contains(kw)) ||
                (r.RecordNumber != null && r.RecordNumber.ToLower().Contains(kw))
            ).ToList();
        }

        return result;
    }

    public async Task<ExceptionRecordDTO> CreateAsync(ExceptionCreateDTO dto, CancellationToken cancellationToken = default)
    {
        var recordNumber = $"EX{DateTime.Now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";

        var exception = new ExceptionRecord
        {
            RecordNumber = recordNumber,
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
            ProcessingDurationHours = null,
            ResponsibleUserId = dto.ResponsibleUserId,
            CreatedByUserId = dto.CreatedByUserId,
            IsResolved = false,
            ResolutionNotes = null,
            ResolvedAt = null,
            ResolvedByUserId = null,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        var created = await _unitOfWork.ExceptionRecords.AddAsync(exception);
        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(created);
    }

    public async Task<ExceptionRecordDTO?> ResolveAsync(ExceptionResolveDTO dto, CancellationToken cancellationToken = default)
    {
        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(dto.ExceptionRecordId);
        if (exception == null) return null;
        if (exception.IsResolved) return null;

        exception.IsResolved = true;
        exception.ResolutionNotes = dto.ResolutionNotes;
        exception.ResolvedAt = DateTime.Now;
        exception.ResolvedByUserId = dto.ResolvedByUserId;
        exception.ProcessingDurationHours = dto.ProcessingDurationHours ??
            (int)Math.Round((DateTime.Now - exception.CreatedAt).TotalHours);
        exception.UpdatedAt = DateTime.Now;

        await _unitOfWork.ExceptionRecords.UpdateAsync(exception);
        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(exception);
    }

    public async Task<ExceptionRecordDTO?> AssignResponsibleAsync(int exceptionId, int responsibleUserId, int assignedByUserId, CancellationToken cancellationToken = default)
    {
        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(exceptionId);
        if (exception == null) return null;

        exception.ResponsibleUserId = responsibleUserId;
        exception.UpdatedAt = DateTime.Now;

        await _unitOfWork.ExceptionRecords.UpdateAsync(exception);
        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(exception);
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var exception = await _unitOfWork.ExceptionRecords.GetByIdAsync(id);
        if (exception == null) return false;

        await _unitOfWork.ExceptionRecords.DeleteAsync(exception);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetOpenCountAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.ExceptionRecords.CountAsync(e => !e.IsResolved);
    }

    public async Task<IEnumerable<ExceptionRecordDTO>> GetOpenExceptionsAsync(int? responsibleUserId = null, CancellationToken cancellationToken = default)
    {
        var query = await _unitOfWork.ExceptionRecords.FindAsync(e => !e.IsResolved);
        var queryable = query.AsQueryable();

        if (responsibleUserId.HasValue)
        {
            queryable = queryable.Where(e => e.ResponsibleUserId == responsibleUserId.Value);
        }

        var result = new List<ExceptionRecordDTO>();
        foreach (var exception in queryable.OrderByDescending(e => e.CreatedAt))
        {
            result.Add(await MapToDTO(exception));
        }
        return result;
    }

    private async Task<ExceptionRecordDTO> MapToDTO(ExceptionRecord exception)
    {
        var allocation = exception.AllocationRequestId.HasValue
            ? (exception.AllocationRequest ?? await _unitOfWork.AllocationRequests.GetByIdAsync(exception.AllocationRequestId.Value))
            : null;
        var supplierReply = exception.SupplierReplyId.HasValue
            ? (exception.SupplierReply ?? await _unitOfWork.SupplierReplies.GetByIdAsync(exception.SupplierReplyId.Value))
            : null;
        var medicine = exception.MedicineId.HasValue
            ? (exception.Medicine ?? await _unitOfWork.Medicines.GetByIdAsync(exception.MedicineId.Value))
            : null;
        var supplier = exception.SupplierId.HasValue
            ? (exception.Supplier ?? await _unitOfWork.Suppliers.GetByIdAsync(exception.SupplierId.Value))
            : null;
        var responsibleUser = exception.ResponsibleUserId.HasValue
            ? (exception.ResponsibleUser ?? await _unitOfWork.Users.GetByIdAsync(exception.ResponsibleUserId.Value))
            : null;
        var createdByUser = exception.CreatedByUserId.HasValue
            ? (exception.CreatedByUser ?? await _unitOfWork.Users.GetByIdAsync(exception.CreatedByUserId.Value))
            : null;

        var processingDurationHours = exception.ProcessingDurationHours;
        if (!exception.IsResolved && !processingDurationHours.HasValue)
        {
            processingDurationHours = (int)Math.Round((DateTime.Now - exception.CreatedAt).TotalHours);
        }

        string? supplierName = supplier?.Name;
        string? supplierCode = supplier?.Code;
        if (supplierReply != null && supplier == null)
        {
            var replySupplier = await _unitOfWork.Suppliers.GetByIdAsync(supplierReply.SupplierId);
            supplierName = replySupplier?.Name;
            supplierCode = replySupplier?.Code;
        }

        return new ExceptionRecordDTO
        {
            Id = exception.Id,
            RecordNumber = exception.RecordNumber,
            ExceptionType = exception.ExceptionType,
            AllocationRequestId = exception.AllocationRequestId,
            AllocationRequestNumber = allocation?.RequestNumber,
            SupplierReplyId = exception.SupplierReplyId,
            SupplierName = supplierName,
            MedicineId = exception.MedicineId,
            MedicineName = medicine?.Name,
            MedicineCode = medicine?.Code,
            SupplierId = exception.SupplierId,
            SupplierCode = supplierCode,
            Title = exception.Title,
            Description = exception.Description,
            RiskLevel = exception.RiskLevel,
            DelayReason = exception.DelayReason,
            ExpectedDate = exception.ExpectedDate,
            ActualDate = exception.ActualDate,
            ProcessingDurationHours = processingDurationHours,
            ResponsibleUserId = exception.ResponsibleUserId,
            ResponsibleUserName = responsibleUser?.Username,
            ResponsibleUserRealName = responsibleUser?.RealName,
            CreatedByUserId = exception.CreatedByUserId,
            CreatedByUserName = createdByUser?.RealName,
            IsResolved = exception.IsResolved,
            ResolutionNotes = exception.ResolutionNotes,
            ResolvedAt = exception.ResolvedAt,
            ResolvedByUserId = exception.ResolvedByUserId,
            CreatedAt = exception.CreatedAt,
            UpdatedAt = exception.UpdatedAt
        };
    }
}
