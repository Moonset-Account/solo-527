using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;
using AutoMapper;

namespace MedicalAllocation.Infrastructure.Repositories;

public class SupplierService : ISupplierService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public SupplierService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<SupplierDTO?> GetSupplierByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        return supplier == null ? null : _mapper.Map<SupplierDTO>(supplier);
    }

    public async Task<IEnumerable<SupplierDTO>> GetAllSuppliersAsync(string? keyword = null, bool? isActive = null, CancellationToken cancellationToken = default)
    {
        var suppliers = await _unitOfWork.Suppliers.GetAllAsync();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            suppliers = suppliers.Where(s =>
                s.Name.Contains(keyword) ||
                s.Code.Contains(keyword) ||
                s.ContactPerson.Contains(keyword));
        }

        if (isActive.HasValue)
        {
            suppliers = suppliers.Where(s => s.IsActive == isActive.Value);
        }

        return _mapper.Map<IEnumerable<SupplierDTO>>(suppliers);
    }

    public async Task<SupplierDTO> CreateSupplierAsync(SupplierDTO dto, CancellationToken cancellationToken = default)
    {
        var supplier = _mapper.Map<Supplier>(dto);
        supplier.CreatedAt = DateTime.Now;
        await _unitOfWork.Suppliers.AddAsync(supplier);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<SupplierDTO>(supplier);
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
        return _mapper.Map<SupplierDTO>(supplier);
    }

    public async Task<bool> DeleteSupplierAsync(int id, CancellationToken cancellationToken = default)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(id);
        if (supplier == null) return false;

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
        return reply == null ? null : _mapper.Map<SupplierReplyDTO>(reply);
    }

    public async Task<IEnumerable<SupplierReplyDTO>> GetRepliesAsync(SupplierReplyQueryDTO? query = null, CancellationToken cancellationToken = default)
    {
        var replies = await _unitOfWork.SupplierReplies.GetAllAsync();

        if (query != null)
        {
            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                replies = replies.Where(r =>
                    (r.Supplier != null && r.Supplier.Name.Contains(query.Keyword)) ||
                    !string.IsNullOrEmpty(r.PurchaseOrderNumber) && r.PurchaseOrderNumber.Contains(query.Keyword));
            }

            if (query.SupplierId.HasValue)
            {
                replies = replies.Where(r => r.SupplierId == query.SupplierId.Value);
            }

            if (query.Status.HasValue)
            {
                replies = replies.Where(r => r.Status == query.Status.Value);
            }

            if (query.StartDate.HasValue)
            {
                replies = replies.Where(r => r.CreatedAt >= query.StartDate.Value);
            }

            if (query.EndDate.HasValue)
            {
                replies = replies.Where(r => r.CreatedAt <= query.EndDate.Value);
            }
        }

        return _mapper.Map<IEnumerable<SupplierReplyDTO>>(replies);
    }

    public async Task<SupplierReplyDTO> CreateReplyAsync(SupplierReplyCreateDTO dto, CancellationToken cancellationToken = default)
    {
        var reply = _mapper.Map<SupplierReply>(dto);
        reply.Status = SupplierReplyStatus.Pending;
        reply.CreatedAt = DateTime.Now;
        reply.UpdatedAt = DateTime.Now;

        await _unitOfWork.SupplierReplies.AddAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<SupplierReplyDTO>(reply);
    }

    public async Task<SupplierReplyDTO?> UpdateReplyStatusAsync(int replyId, SupplierReplyStatus status, int? userId = null, CancellationToken cancellationToken = default)
    {
        var reply = await _unitOfWork.SupplierReplies.GetByIdAsync(replyId);
        if (reply == null) return null;

        reply.Status = status;
        reply.UpdatedAt = DateTime.Now;
        if (status == SupplierReplyStatus.Replied)
        {
            reply.RepliedAt = DateTime.Now;
            reply.RepliedByUserId = userId;
        }

        await _unitOfWork.SupplierReplies.UpdateAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<SupplierReplyDTO>(reply);
    }

    public async Task<SupplierReplyDTO?> ConfirmReplyAsync(int replyId, int confirmedByUserId, CancellationToken cancellationToken = default)
    {
        var reply = await _unitOfWork.SupplierReplies.GetByIdAsync(replyId);
        if (reply == null) return null;

        reply.Status = SupplierReplyStatus.Confirmed;
        reply.ConfirmedByUserId = confirmedByUserId;
        reply.ConfirmedAt = DateTime.Now;
        reply.UpdatedAt = DateTime.Now;

        await _unitOfWork.SupplierReplies.UpdateAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<SupplierReplyDTO>(reply);
    }

    public async Task<SupplierReplyDTO?> RecordDelayAsync(int replyId, string delayReason, int delayDays, int? userId = null, CancellationToken cancellationToken = default)
    {
        var reply = await _unitOfWork.SupplierReplies.GetByIdAsync(replyId);
        if (reply == null) return null;

        reply.Status = SupplierReplyStatus.Delayed;
        reply.DelayReason = delayReason;
        reply.DelayDays = delayDays;
        reply.UpdatedAt = DateTime.Now;

        await _unitOfWork.SupplierReplies.UpdateAsync(reply);
        await _unitOfWork.SaveChangesAsync();
        return _mapper.Map<SupplierReplyDTO>(reply);
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
}
