using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;
using AutoMapper;

namespace MedicalAllocation.Infrastructure.Repositories;

public class ReplenishmentService : IReplenishmentService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public ReplenishmentService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<ReplenishmentSuggestionDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var suggestion = await _unitOfWork.ReplenishmentSuggestions.GetByIdAsync(id);
        return suggestion == null ? null : MapToDTO(suggestion);
    }

    public async Task<IEnumerable<ReplenishmentSuggestionDTO>> GetAllAsync(ReplenishmentQueryDTO? query = null, CancellationToken cancellationToken = default)
    {
        var suggestions = await _unitOfWork.ReplenishmentSuggestions.GetAllAsync();

        if (query != null)
        {
            if (!string.IsNullOrWhiteSpace(query.Keyword))
            {
                suggestions = suggestions.Where(s =>
                    (s.Medicine != null && (s.Medicine.Name.Contains(query.Keyword) || s.Medicine.Code.Contains(query.Keyword))) ||
                    (s.Warehouse != null && s.Warehouse.Name.Contains(query.Keyword))
                );
            }

            if (query.WarehouseId.HasValue)
            {
                suggestions = suggestions.Where(s => s.WarehouseId == query.WarehouseId.Value);
            }

            if (query.IsProcessed.HasValue)
            {
                suggestions = suggestions.Where(s => s.IsProcessed == query.IsProcessed.Value);
            }

            if (query.Priority.HasValue)
            {
                suggestions = suggestions.Where(s => s.Priority == query.Priority.Value);
            }

            if (query.RiskLevel.HasValue)
            {
                suggestions = suggestions.Where(s => s.RiskLevel == query.RiskLevel.Value);
            }
        }

        return suggestions.Select(MapToDTO);
    }

    public async Task<ReplenishmentSuggestionDTO> CreateAsync(CreateReplenishmentDTO dto, CancellationToken cancellationToken = default)
    {
        var inventories = await _unitOfWork.Inventories
            .FindAsync(i => i.MedicineId == dto.MedicineId && i.WarehouseId == dto.WarehouseId);
        var inventory = inventories.FirstOrDefault();
        var medicine = await _unitOfWork.Medicines.GetByIdAsync(dto.MedicineId);

        var currentStock = inventory?.Quantity ?? 0;
        var safetyStock = medicine?.SafetyStock ?? 0;

        var suggestion = new ReplenishmentSuggestion
        {
            MedicineId = dto.MedicineId,
            WarehouseId = dto.WarehouseId,
            CurrentStock = currentStock,
            SafetyStock = safetyStock,
            SuggestedQuantity = dto.SuggestedQuantity,
            Priority = dto.Priority,
            RiskLevel = CalculateRiskLevel(currentStock, safetyStock),
            PreferredSupplierId = dto.PreferredSupplierId,
            IsProcessed = false,
            GeneratedAt = DateTime.Now,
            CreatedByUserId = dto.CreatedByUserId
        };

        await _unitOfWork.ReplenishmentSuggestions.AddAsync(suggestion);
        await _unitOfWork.SaveChangesAsync();
        return MapToDTO(suggestion);
    }

    public async Task MarkAsProcessedAsync(int id, int processedByUserId, CancellationToken cancellationToken = default)
    {
        var suggestion = await _unitOfWork.ReplenishmentSuggestions.GetByIdAsync(id);
        if (suggestion == null) return;

        suggestion.IsProcessed = true;
        suggestion.CreatedByUserId = processedByUserId;

        await _unitOfWork.ReplenishmentSuggestions.UpdateAsync(suggestion);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task BatchMarkAsProcessedAsync(IEnumerable<int> ids, int processedByUserId, CancellationToken cancellationToken = default)
    {
        foreach (var id in ids)
        {
            await MarkAsProcessedAsync(id, processedByUserId, cancellationToken);
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var suggestion = await _unitOfWork.ReplenishmentSuggestions.GetByIdAsync(id);
        if (suggestion == null) return false;

        await _unitOfWork.ReplenishmentSuggestions.DeleteAsync(suggestion);
        await _unitOfWork.SaveChangesAsync();
        return true;
    }

    public async Task GenerateReplenishmentSuggestionsAsync(CancellationToken cancellationToken = default)
    {
        var inventories = await _unitOfWork.Inventories.GetAllAsync();

        foreach (var inv in inventories)
        {
            if (inv.Medicine == null) continue;
            if (inv.Quantity >= inv.Medicine.SafetyStock) continue;

            var existing = await _unitOfWork.ReplenishmentSuggestions
                .FindAsync(s => s.MedicineId == inv.MedicineId && s.WarehouseId == inv.WarehouseId && !s.IsProcessed);

            if (existing.Any()) continue;

            var gap = inv.Medicine.MaxStock - inv.Quantity;
            var suggestedQty = Math.Max(gap, inv.Medicine.SafetyStock * 2);
            var priority = ReplenishmentPriority.Normal;
            var riskLevel = CalculateRiskLevel(inv.Quantity, inv.Medicine.SafetyStock);

            if (inv.Quantity <= 0)
                priority = ReplenishmentPriority.Emergency;
            else if (inv.Quantity < inv.Medicine.SafetyStock * 0.3m)
                priority = ReplenishmentPriority.Emergency;
            else if (inv.Quantity < inv.Medicine.SafetyStock * 0.6m)
                priority = ReplenishmentPriority.Urgent;

            await CreateAsync(new CreateReplenishmentDTO
            {
                MedicineId = inv.MedicineId,
                WarehouseId = inv.WarehouseId,
                CurrentStock = inv.Quantity,
                SafetyStock = inv.Medicine.SafetyStock,
                SuggestedQuantity = suggestedQty,
                Priority = priority,
                Reason = inv.Quantity <= 0 ? "缺货紧急补货" : $"库存低于安全库存，当前库存 {inv.Quantity}，安全库存 {inv.Medicine.SafetyStock}",
                CreatedByUserId = 1
            }, cancellationToken);
        }
    }

    public async Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.ReplenishmentSuggestions.CountAsync(s => !s.IsProcessed);
    }

    private static ReplenishmentSuggestionDTO MapToDTO(ReplenishmentSuggestion s)
    {
        return new ReplenishmentSuggestionDTO
        {
            Id = s.Id,
            MedicineId = s.MedicineId,
            MedicineName = s.Medicine?.Name,
            MedicineCode = s.Medicine?.Code,
            WarehouseId = s.WarehouseId,
            WarehouseName = s.Warehouse?.Name,
            CurrentStock = s.CurrentStock,
            SafetyStock = s.SafetyStock,
            SuggestedQuantity = s.SuggestedQuantity,
            AverageDailyUsage = s.AverageDailyUsage,
            DaysUntilStockout = s.DaysUntilStockout,
            RiskLevel = s.RiskLevel,
            Priority = s.Priority,
            PreferredSupplierId = s.PreferredSupplierId,
            PreferredSupplierName = s.PreferredSupplier?.Name,
            IsProcessed = s.IsProcessed,
            GeneratedAt = s.GeneratedAt,
            CreatedByUserId = s.CreatedByUserId
        };
    }

    private static RiskLevel CalculateRiskLevel(decimal currentStock, decimal safetyStock)
    {
        if (currentStock <= 0) return RiskLevel.Critical;
        if (currentStock < safetyStock * 0.3m) return RiskLevel.Critical;
        if (currentStock < safetyStock * 0.6m) return RiskLevel.High;
        if (currentStock < safetyStock) return RiskLevel.Medium;
        return RiskLevel.Low;
    }
}
