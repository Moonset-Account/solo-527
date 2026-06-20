using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;

namespace MedicalAllocation.Application.Services;

public class SupplierService : ISupplierService
{
    private readonly IUnitOfWork _unitOfWork;

    public SupplierService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<SupplierDTO?> GetSupplierByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        return supplier == null ? null : MapToSupplierDTO(supplier);
    }

    public async Task<IEnumerable<SupplierDTO>> GetAllSuppliersAsync(string? keyword = null, bool? isActive = null, CancellationToken cancellationToken = default)
    {
        var suppliers = await _unitOfWork.Suppliers.GetAllAsync();
        var queryable = suppliers.AsQueryable();

        if (isActive.HasValue)
        {
            queryable = queryable.Where(s => s.IsActive == isActive.Value);
        }

        var result = queryable.OrderByDescending(s => s.CreatedAt).Select(MapToSupplierDTO).ToList();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.Trim().ToLower();
            result = result.Where(s =>
                s.Name.ToLower().Contains(kw) ||
                s.Code.ToLower().Contains(kw) ||
                s.ContactPerson.ToLower().Contains(kw) ||
                s.Phone.ToLower().Contains(kw)
            ).ToList();
        }

        return result;
    }

    public async Task<SupplierDTO> CreateSupplierAsync(SupplierDTO dto, CancellationToken cancellationToken = default)
    {
        var supplier = new Supplier
        {
            Code = dto.Code,
            Name = dto.Name,
            ContactPerson = dto.ContactPerson,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            BusinessLicense = dto.BusinessLicense,
            GspCertificate = dto.GspCertificate,
            Rating = dto.Rating,
            IsActive = dto.IsActive,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        var created = await _unitOfWork.Suppliers.AddAsync(supplier);
        await _unitOfWork.SaveChangesAsync();
        return MapToSupplierDTO(created);
    }

    public async Task<SupplierDTO?> UpdateSupplierAsync(SupplierDTO dto, CancellationToken cancellationToken = default)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(dto.Id);
        if (supplier == null) return null;

        supplier.Code = dto.Code;
        supplier.Name = dto.Name;
        supplier.ContactPerson = dto.ContactPerson;
        supplier.Phone = dto.Phone;
        supplier.Email = dto.Email;
        supplier.Address = dto.Address;
        supplier.BusinessLicense = dto.BusinessLicense;
        supplier.GspCertificate = dto.GspCertificate;
        supplier.Rating = dto.Rating;
        supplier.IsActive = dto.IsActive;
        supplier.UpdatedAt = DateTime.Now;

        await _unitOfWork.Suppliers.UpdateAsync(supplier);
        await _unitOfWork.SaveChangesAsync();
        return MapToSupplierDTO(supplier);
    }

    public async Task<bool> DeleteSupplierAsync(int id, CancellationToken cancellationToken = default)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        if (supplier == null) return false;

        var replies = await _unitOfWork.SupplierReplies.FindAsync(r => r.SupplierId == id);
        foreach (var reply in replies)
        {
            await _unitOfWork.SupplierReplies.DeleteAsync(reply);
        }

        await _unitOfWork.Suppliers.DeleteAsync(supplier);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ToggleSupplierActiveAsync(int id, CancellationToken cancellationToken = default)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        if (supplier == null) return false;

        supplier.IsActive = !supplier.IsActive;
        supplier.UpdatedAt = DateTime.Now;

        await _unitOfWork.Suppliers.UpdateAsync(supplier);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<SupplierReplyDTO?> GetReplyByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var reply = await _unitOfWork.SupplierReplies.GetByIdAsync(id);
        if (reply == null) return null;
        return await MapToReplyDTO(reply);
    }

    public async Task<IEnumerable<SupplierReplyDTO>> GetRepliesAsync(SupplierReplyQueryDTO? query = null, CancellationToken cancellationToken = default)
    {
        var replies = await _unitOfWork.SupplierReplies.GetAllAsync();
        var queryable = replies.AsQueryable();

        if (query != null)
        {
            if (query.SupplierId.HasValue)
            {
                queryable = queryable.Where(r => r.SupplierId == query.SupplierId.Value);
            }

            if (query.Status.HasValue)
            {
                queryable = queryable.Where(r => r.Status == query.Status.Value);
            }

            if (query.StartDate.HasValue)
            {
                queryable = queryable.Where(r => r.CreatedAt >= query.StartDate.Value);
            }

            if (query.EndDate.HasValue)
            {
                queryable = queryable.Where(r => r.CreatedAt <= query.EndDate.Value);
            }
        }

        var result = new List<SupplierReplyDTO>();
        foreach (var reply in queryable.OrderByDescending(r => r.CreatedAt))
        {
            result.Add(await MapToReplyDTO(reply));
        }

        if (!string.IsNullOrWhiteSpace(query?.Keyword))
        {
            var kw = query.Keyword.Trim().ToLower();
            result = result.Where(r =>
                (r.SupplierName != null && r.SupplierName.ToLower().Contains(kw)) ||
                (r.PurchaseOrderNumber != null && r.PurchaseOrderNumber.ToLower().Contains(kw)) ||
                (r.ReplenishmentMedicineName != null && r.ReplenishmentMedicineName.ToLower().Contains(kw))
            ).ToList();
        }

        return result;
    }

    public async Task<SupplierReplyDTO> CreateReplyAsync(SupplierReplyCreateDTO dto, CancellationToken cancellationToken = default)
    {
        var reply = new SupplierReply
        {
            ReplenishmentSuggestionId = dto.ReplenishmentSuggestionId,
            SupplierId = dto.SupplierId,
            PurchaseOrderNumber = dto.PurchaseOrderNumber,
            QuotedQuantity = dto.QuotedQuantity,
            QuotedUnitPrice = dto.QuotedUnitPrice,
            PromisedDeliveryDate = dto.PromisedDeliveryDate,
            BatchNumber = dto.BatchNumber,
            ProductionDate = dto.ProductionDate,
            ExpiryDate = dto.ExpiryDate,
            Status = SupplierReplyStatus.Replied,
            SupplierNotes = dto.SupplierNotes,
            ReplyDueDate = dto.ReplyDueDate,
            RepliedAt = DateTime.Now,
            RepliedByUserId = dto.RepliedByUserId,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now
        };

        var created = await _unitOfWork.SupplierReplies.AddAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return await MapToReplyDTO(created);
    }

    public async Task<SupplierReplyDTO?> UpdateReplyStatusAsync(int replyId, SupplierReplyStatus status, int? userId = null, CancellationToken cancellationToken = default)
    {
        var reply = await _unitOfWork.SupplierReplies.GetByIdAsync(replyId);
        if (reply == null) return null;

        reply.Status = status;
        reply.UpdatedAt = DateTime.Now;

        if (status == SupplierReplyStatus.Replied && !reply.RepliedAt.HasValue)
        {
            reply.RepliedAt = DateTime.Now;
            reply.RepliedByUserId = userId;
        }

        await _unitOfWork.SupplierReplies.UpdateAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return await MapToReplyDTO(reply);
    }

    public async Task<SupplierReplyDTO?> ConfirmReplyAsync(int replyId, int confirmedByUserId, CancellationToken cancellationToken = default)
    {
        var reply = await _unitOfWork.SupplierReplies.GetByIdAsync(replyId);
        if (reply == null) return null;
        if (reply.Status != SupplierReplyStatus.Replied && reply.Status != SupplierReplyStatus.Delayed) return null;

        reply.Status = SupplierReplyStatus.Confirmed;
        reply.ConfirmedByUserId = confirmedByUserId;
        reply.ConfirmedAt = DateTime.Now;
        reply.ActualDeliveryDate = DateTime.Now;
        reply.UpdatedAt = DateTime.Now;

        await _unitOfWork.SupplierReplies.UpdateAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return await MapToReplyDTO(reply);
    }

    public async Task<SupplierReplyDTO?> RecordDelayAsync(int replyId, string delayReason, int delayDays, int? userId = null, CancellationToken cancellationToken = default)
    {
        var reply = await _unitOfWork.SupplierReplies.GetByIdAsync(replyId);
        if (reply == null) return null;

        reply.Status = SupplierReplyStatus.Delayed;
        reply.DelayReason = delayReason;
        reply.DelayDays = delayDays;
        reply.UpdatedAt = DateTime.Now;

        if (reply.Status == SupplierReplyStatus.Pending)
        {
            reply.RepliedAt = DateTime.Now;
            reply.RepliedByUserId = userId;
        }

        await _unitOfWork.SupplierReplies.UpdateAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return await MapToReplyDTO(reply);
    }

    public async Task<bool> DeleteReplyAsync(int id, CancellationToken cancellationToken = default)
    {
        var reply = await _unitOfWork.SupplierReplies.GetByIdAsync(id);
        if (reply == null) return false;

        await _unitOfWork.SupplierReplies.DeleteAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task<int> GetPendingReplyCountAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.SupplierReplies.CountAsync(r => r.Status == SupplierReplyStatus.Pending);
    }

    private static SupplierDTO MapToSupplierDTO(Supplier supplier)
    {
        return new SupplierDTO
        {
            Id = supplier.Id,
            Code = supplier.Code,
            Name = supplier.Name,
            ContactPerson = supplier.ContactPerson,
            Phone = supplier.Phone,
            Email = supplier.Email,
            Address = supplier.Address,
            BusinessLicense = supplier.BusinessLicense,
            GspCertificate = supplier.GspCertificate,
            Rating = supplier.Rating,
            IsActive = supplier.IsActive,
            CreatedAt = supplier.CreatedAt,
            UpdatedAt = supplier.UpdatedAt
        };
    }

    private async Task<SupplierReplyDTO> MapToReplyDTO(SupplierReply reply)
    {
        var supplier = reply.Supplier ?? await _unitOfWork.Suppliers.GetByIdAsync(reply.SupplierId);
        var suggestion = reply.ReplenishmentSuggestion ?? await _unitOfWork.ReplenishmentSuggestions.GetByIdAsync(reply.ReplenishmentSuggestionId);

        string? medicineName = null;
        string? warehouseName = null;
        decimal? suggestedQuantity = null;

        if (suggestion != null)
        {
            suggestedQuantity = suggestion.SuggestedQuantity;
            var medicine = suggestion.Medicine ?? await _unitOfWork.Medicines.GetByIdAsync(suggestion.MedicineId);
            var warehouse = suggestion.Warehouse ?? await _unitOfWork.Warehouses.GetByIdAsync(suggestion.WarehouseId);
            medicineName = medicine?.Name;
            warehouseName = warehouse?.Name;
        }

        var processingDurationHours = reply.RepliedAt.HasValue
            ? (int?)Math.Round((reply.RepliedAt.Value - reply.CreatedAt).TotalHours)
            : null;

        return new SupplierReplyDTO
        {
            Id = reply.Id,
            ReplenishmentSuggestionId = reply.ReplenishmentSuggestionId,
            ReplenishmentMedicineName = medicineName,
            ReplenishmentWarehouseName = warehouseName,
            ReplenishmentSuggestedQuantity = suggestedQuantity,
            SupplierId = reply.SupplierId,
            SupplierName = supplier?.Name,
            SupplierCode = supplier?.Code,
            PurchaseOrderNumber = reply.PurchaseOrderNumber,
            QuotedQuantity = reply.QuotedQuantity,
            QuotedUnitPrice = reply.QuotedUnitPrice,
            PromisedDeliveryDate = reply.PromisedDeliveryDate,
            ActualDeliveryDate = reply.ActualDeliveryDate,
            BatchNumber = reply.BatchNumber,
            ProductionDate = reply.ProductionDate,
            ExpiryDate = reply.ExpiryDate,
            Status = reply.Status,
            SupplierNotes = reply.SupplierNotes,
            InternalNotes = reply.InternalNotes,
            ReplyDueDate = reply.ReplyDueDate,
            RepliedAt = reply.RepliedAt,
            RepliedByUserId = reply.RepliedByUserId,
            ConfirmedByUserId = reply.ConfirmedByUserId,
            ConfirmedAt = reply.ConfirmedAt,
            DelayReason = reply.DelayReason,
            DelayDays = reply.DelayDays,
            CreatedAt = reply.CreatedAt,
            UpdatedAt = reply.UpdatedAt
        };
    }
}
