using MedicalAllocation.Application.DTOs;
using MedicalAllocation.Application.Interfaces;
using MedicalAllocation.Domain.Entities;
using MedicalAllocation.Domain.Enums;
using MedicalAllocation.Domain.Interfaces;

namespace MedicalAllocation.Application.Services;

public class ReplenishmentService : IReplenishmentService
{
    private readonly IUnitOfWork _unitOfWork;

    public ReplenishmentService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<ReplenishmentSuggestionDTO?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var suggestion = await _unitOfWork.ReplenishmentSuggestions.GetByIdAsync(id);
        if (suggestion == null) return null;
        return await MapToDTO(suggestion);
    }

    public async Task<IEnumerable<ReplenishmentSuggestionDTO>> GetAllAsync(ReplenishmentQueryDTO? query = null, CancellationToken cancellationToken = default)
    {
        var suggestions = await _unitOfWork.ReplenishmentSuggestions.GetAllAsync();
        var queryable = suggestions.AsQueryable();

        if (query != null)
        {
            if (query.WarehouseId.HasValue)
            {
                queryable = queryable.Where(s => s.WarehouseId == query.WarehouseId.Value);
            }

            if (query.RiskLevel.HasValue)
            {
                queryable = queryable.Where(s => s.RiskLevel == query.RiskLevel.Value);
            }

            if (query.Priority.HasValue)
            {
                queryable = queryable.Where(s => s.Priority == query.Priority.Value);
            }

            if (query.IsProcessed.HasValue)
            {
                queryable = queryable.Where(s => s.IsProcessed == query.IsProcessed.Value);
            }
        }

        var result = new List<ReplenishmentSuggestionDTO>();
        foreach (var suggestion in queryable.OrderByDescending(s => s.GeneratedAt))
        {
            result.Add(await MapToDTO(suggestion));
        }

        if (!string.IsNullOrWhiteSpace(query?.Keyword))
        {
            var keyword = query.Keyword.Trim().ToLower();
            result = result.Where(r =>
                (r.MedicineName != null && r.MedicineName.ToLower().Contains(keyword)) ||
                (r.MedicineCode != null && r.MedicineCode.ToLower().Contains(keyword)) ||
                (r.WarehouseName != null && r.WarehouseName.ToLower().Contains(keyword))
            ).ToList();
        }

        return result;
    }

    public async Task<ReplenishmentSuggestionDTO> CreateAsync(CreateReplenishmentDTO dto, CancellationToken cancellationToken = default)
    {
        var medicine = await _unitOfWork.Medicines.GetByIdAsync(dto.MedicineId);
        var inventory = (await _unitOfWork.Inventories
            .FindAsync(i => i.MedicineId == dto.MedicineId && i.WarehouseId == dto.WarehouseId))
            .FirstOrDefault();

        var currentStock = inventory?.AvailableQuantity ?? 0;
        var safetyStock = medicine?.SafetyStock ?? 0;
        var ratio = safetyStock > 0 ? currentStock / safetyStock : 1;

        var riskLevel = ratio switch
        {
            >= 1.0m => RiskLevel.Low,
            >= 0.8m => RiskLevel.Medium,
            >= 0.5m => RiskLevel.High,
            _ => RiskLevel.Critical
        };

        var averageDailyUsage = (medicine != null && medicine.LeadTimeDays > 0)
            ? currentStock / medicine.LeadTimeDays
            : 0;

        var daysUntilStockout = averageDailyUsage > 0
            ? Math.Round(currentStock / averageDailyUsage, 2)
            : 30;

        var suggestion = new ReplenishmentSuggestion
        {
            MedicineId = dto.MedicineId,
            WarehouseId = dto.WarehouseId,
            CurrentStock = currentStock,
            SafetyStock = safetyStock,
            SuggestedQuantity = dto.SuggestedQuantity,
            AverageDailyUsage = averageDailyUsage,
            DaysUntilStockout = daysUntilStockout,
            RiskLevel = riskLevel,
            Priority = dto.Priority,
            PreferredSupplierId = dto.PreferredSupplierId,
            IsProcessed = false,
            GeneratedAt = DateTime.Now,
            CreatedByUserId = dto.CreatedByUserId
        };

        var created = await _unitOfWork.ReplenishmentSuggestions.AddAsync(suggestion);
        await _unitOfWork.SaveChangesAsync();
        return await MapToDTO(created);
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
            var suggestion = await _unitOfWork.ReplenishmentSuggestions.GetByIdAsync(id);
            if (suggestion != null)
            {
                suggestion.IsProcessed = true;
                suggestion.CreatedByUserId = processedByUserId;
                await _unitOfWork.ReplenishmentSuggestions.UpdateAsync(suggestion);
            }
        }
        await _unitOfWork.SaveChangesAsync();
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
        var medicines = await _unitOfWork.Medicines.GetAllAsync();
        var suppliers = await _unitOfWork.Suppliers.GetAllAsync();
        var existingSuggestions = await _unitOfWork.ReplenishmentSuggestions.GetAllAsync();

        var medicinesDict = medicines.ToDictionary(m => m.Id);
        var today = DateTime.Today;

        var existingKeys = existingSuggestions
            .Where(s => s.GeneratedAt >= today.AddDays(-1) && !s.IsProcessed)
            .Select(s => (s.MedicineId, s.WarehouseId))
            .ToHashSet();

        var supplierList = suppliers.ToList();

        foreach (var inv in inventories)
        {
            if (!medicinesDict.TryGetValue(inv.MedicineId, out var medicine)) continue;

            var key = (inv.MedicineId, inv.WarehouseId);
            if (existingKeys.Contains(key)) continue;

            if (medicine.SafetyStock <= 0) continue;

            var ratio = inv.AvailableQuantity / medicine.SafetyStock;
            if (ratio >= 1.0m) continue;

            var riskLevel = ratio switch
            {
                >= 0.8m => RiskLevel.Medium,
                >= 0.5m => RiskLevel.High,
                _ => RiskLevel.Critical
            };

            var priority = ratio switch
            {
                >= 0.8m => ReplenishmentPriority.Normal,
                >= 0.5m => ReplenishmentPriority.Urgent,
                _ => ReplenishmentPriority.Emergency
            };

            var averageDailyUsage = medicine.LeadTimeDays > 0
                ? inv.AvailableQuantity / medicine.LeadTimeDays
                : 0;

            var daysUntilStockout = averageDailyUsage > 0
                ? Math.Round(inv.AvailableQuantity / averageDailyUsage, 2)
                : 30;

            var suggestedQuantity = Math.Max(
                medicine.SafetyStock * 2 - inv.AvailableQuantity,
                medicine.MaxStock - inv.AvailableQuantity
            );

            var preferredSupplier = supplierList.FirstOrDefault();

            await _unitOfWork.ReplenishmentSuggestions.AddAsync(new ReplenishmentSuggestion
            {
                MedicineId = inv.MedicineId,
                WarehouseId = inv.WarehouseId,
                CurrentStock = inv.AvailableQuantity,
                SafetyStock = medicine.SafetyStock,
                SuggestedQuantity = Math.Max(0, suggestedQuantity),
                AverageDailyUsage = averageDailyUsage,
                DaysUntilStockout = daysUntilStockout,
                RiskLevel = riskLevel,
                Priority = priority,
                PreferredSupplierId = preferredSupplier?.Id,
                IsProcessed = false,
                GeneratedAt = DateTime.Now,
                CreatedByUserId = null
            });
        }

        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<int> GetPendingCountAsync(CancellationToken cancellationToken = default)
    {
        return await _unitOfWork.ReplenishmentSuggestions.CountAsync(s => !s.IsProcessed);
    }

    private async Task<ReplenishmentSuggestionDTO> MapToDTO(ReplenishmentSuggestion suggestion)
    {
        var medicine = suggestion.Medicine ?? await _unitOfWork.Medicines.GetByIdAsync(suggestion.MedicineId);
        var warehouse = suggestion.Warehouse ?? await _unitOfWork.Warehouses.GetByIdAsync(suggestion.WarehouseId);
        Supplier? supplier = null;

        if (suggestion.PreferredSupplierId.HasValue)
        {
            supplier = suggestion.PreferredSupplier ?? await _unitOfWork.Suppliers.GetByIdAsync(suggestion.PreferredSupplierId.Value);
        }

        return new ReplenishmentSuggestionDTO
        {
            Id = suggestion.Id,
            MedicineId = suggestion.MedicineId,
            MedicineName = medicine?.Name,
            MedicineCode = medicine?.Code,
            WarehouseId = suggestion.WarehouseId,
            WarehouseName = warehouse?.Name,
            CurrentStock = suggestion.CurrentStock,
            SafetyStock = suggestion.SafetyStock,
            SuggestedQuantity = suggestion.SuggestedQuantity,
            AverageDailyUsage = suggestion.AverageDailyUsage,
            DaysUntilStockout = suggestion.DaysUntilStockout,
            RiskLevel = suggestion.RiskLevel,
            Priority = suggestion.Priority,
            PreferredSupplierId = suggestion.PreferredSupplierId,
            PreferredSupplierName = supplier?.Name,
            IsProcessed = suggestion.IsProcessed,
            GeneratedAt = suggestion.GeneratedAt,
            CreatedByUserId = suggestion.CreatedByUserId
        };
    }
}
