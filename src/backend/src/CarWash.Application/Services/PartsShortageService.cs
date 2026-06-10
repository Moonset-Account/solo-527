using CarWash.Application.DTOs;
using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;

namespace CarWash.Application.Services;

public class PartsShortageService : IPartsShortageService
{
    private readonly IRepository<PartsShortage> _partsShortageRepository;
    private readonly IRepository<PartsShortageNode> _partsShortageNodeRepository;
    private readonly IRedisCacheService _cacheService;

    public PartsShortageService(
        IRepository<PartsShortage> partsShortageRepository,
        IRepository<PartsShortageNode> partsShortageNodeRepository,
        IRedisCacheService cacheService)
    {
        _partsShortageRepository = partsShortageRepository;
        _partsShortageNodeRepository = partsShortageNodeRepository;
        _cacheService = cacheService;
    }

    public async Task<PartsShortageDto> CreateAsync(CreatePartsShortageRequest request, CancellationToken cancellationToken = default)
    {
        var shortage = new PartsShortage
        {
            Id = Guid.NewGuid(),
            PartName = request.PartName,
            AffectedServices = request.AffectedServices.Count > 0 ? string.Join(",", request.AffectedServices) : null,
            AffectedWorkstationIds = request.AffectedWorkstationIds.Count > 0
                ? string.Join(",", request.AffectedWorkstationIds)
                : null,
            Status = "reported",
            EstimatedArrival = request.EstimatedArrival,
            ReportedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _partsShortageRepository.AddAsync(shortage, cancellationToken);

        var initialNode = new PartsShortageNode
        {
            Id = Guid.NewGuid(),
            PartsShortageId = created.Id,
            Status = "reported",
            OperatorId = request.OperatorId,
            OperatorName = request.OperatorName,
            Timestamp = DateTime.UtcNow,
            Notes = request.Notes
        };

        await _partsShortageNodeRepository.AddAsync(initialNode, cancellationToken);

        await _cacheService.RemoveAsync("parts:shortage:active", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        var nodes = new List<PartsShortageNode> { initialNode };
        return MapToDto(created, nodes);
    }

    public async Task<PartsShortageDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var shortage = await _partsShortageRepository.GetByIdAsync(id, cancellationToken);
        if (shortage == null) return null;

        var nodes = await _partsShortageNodeRepository.GetAsync(
            n => n.PartsShortageId == id,
            cancellationToken);

        return MapToDto(shortage, nodes.OrderBy(n => n.Timestamp).ToList());
    }

    public async Task<List<PartsShortageDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var shortages = await _partsShortageRepository.GetAllAsync(cancellationToken);
        var dtos = new List<PartsShortageDto>();

        foreach (var shortage in shortages.OrderByDescending(s => s.ReportedAt))
        {
            var nodes = await _partsShortageNodeRepository.GetAsync(
                n => n.PartsShortageId == shortage.Id,
                cancellationToken);

            dtos.Add(MapToDto(shortage, nodes.OrderBy(n => n.Timestamp).ToList()));
        }

        return dtos;
    }

    public async Task<List<PartsShortageDto>> GetActiveShortagesAsync(CancellationToken cancellationToken = default)
    {
        var cacheKey = "parts:shortage:active";
        var cached = await _cacheService.GetAsync<List<PartsShortageDto>>(cacheKey, cancellationToken);
        if (cached != null) return cached;

        var shortages = await _partsShortageRepository.GetAsync(
            s => s.Status != "restocked" && s.Status != "resolved",
            cancellationToken);

        var dtos = new List<PartsShortageDto>();
        foreach (var shortage in shortages.OrderByDescending(s => s.ReportedAt))
        {
            var nodes = await _partsShortageNodeRepository.GetAsync(
                n => n.PartsShortageId == shortage.Id,
                cancellationToken);

            dtos.Add(MapToDto(shortage, nodes.OrderBy(n => n.Timestamp).ToList()));
        }

        await _cacheService.SetAsync(cacheKey, dtos, TimeSpan.FromMinutes(10), cancellationToken);
        return dtos;
    }

    public async Task<PartsShortageDto> UpdateStatusAsync(Guid id, UpdatePartsShortageStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var shortage = await _partsShortageRepository.GetByIdAsync(id, cancellationToken);
        if (shortage == null)
            throw new KeyNotFoundException($"PartsShortage with id {id} not found");

        shortage.Status = request.Status;
        if (request.EstimatedArrival.HasValue)
            shortage.EstimatedArrival = request.EstimatedArrival.Value;

        shortage.UpdatedAt = DateTime.UtcNow;

        await _partsShortageRepository.UpdateAsync(shortage, cancellationToken);

        var node = new PartsShortageNode
        {
            Id = Guid.NewGuid(),
            PartsShortageId = id,
            Status = request.Status,
            OperatorId = request.OperatorId,
            OperatorName = request.OperatorName,
            Timestamp = DateTime.UtcNow,
            Notes = request.Notes
        };

        await _partsShortageNodeRepository.AddAsync(node, cancellationToken);

        await _cacheService.RemoveAsync("parts:shortage:active", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        var nodes = await _partsShortageNodeRepository.GetAsync(
            n => n.PartsShortageId == id,
            cancellationToken);

        return MapToDto(shortage, nodes.OrderBy(n => n.Timestamp).ToList());
    }

    public async Task<bool> ResolveAsync(Guid id, Guid operatorId, string operatorName,
        CancellationToken cancellationToken = default)
    {
        var shortage = await _partsShortageRepository.GetByIdAsync(id, cancellationToken);
        if (shortage == null) return false;

        shortage.Status = "restocked";
        shortage.ResolvedAt = DateTime.UtcNow;
        shortage.UpdatedAt = DateTime.UtcNow;

        await _partsShortageRepository.UpdateAsync(shortage, cancellationToken);

        var node = new PartsShortageNode
        {
            Id = Guid.NewGuid(),
            PartsShortageId = id,
            Status = "restocked",
            OperatorId = operatorId,
            OperatorName = operatorName,
            Timestamp = DateTime.UtcNow
        };

        await _partsShortageNodeRepository.AddAsync(node, cancellationToken);

        await _cacheService.RemoveAsync("parts:shortage:active", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return true;
    }

    private static PartsShortageDto MapToDto(PartsShortage shortage, List<PartsShortageNode> nodes)
    {
        var nodeDtos = nodes.Select(n => new PartsShortageNodeDto
        {
            Id = n.Id,
            Status = n.Status,
            OperatorId = n.OperatorId,
            OperatorName = n.OperatorName,
            Timestamp = n.Timestamp,
            Notes = n.Notes
        }).ToList();

        return new PartsShortageDto
        {
            Id = shortage.Id,
            PartName = shortage.PartName,
            AffectedServices = string.IsNullOrEmpty(shortage.AffectedServices)
                ? new List<string>()
                : shortage.AffectedServices.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
            AffectedWorkstationIds = string.IsNullOrEmpty(shortage.AffectedWorkstationIds)
                ? new List<Guid>()
                : shortage.AffectedWorkstationIds.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(Guid.Parse).ToList(),
            Status = shortage.Status,
            EstimatedArrival = shortage.EstimatedArrival,
            ReportedAt = shortage.ReportedAt,
            ResolvedAt = shortage.ResolvedAt,
            Nodes = nodeDtos
        };
    }
}
