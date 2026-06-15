
using MediatR;
using Microsoft.EntityFrameworkCore;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Cache;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Application.Features.Equipment.Queries;

public class GetEquipmentListQuery : IRequest<List<EquipmentDto>>
{
    public EquipmentStatus? Status { get; set; }
    public string? Type { get; set; }
}

public class GetEquipmentListQueryHandler : IRequestHandler<GetEquipmentListQuery, List<EquipmentDto>>
{
    private readonly PrintingFactoryDbContext _context;
    private readonly ICacheService _cacheService;

    public GetEquipmentListQueryHandler(PrintingFactoryDbContext context, ICacheService cacheService)
    {
        _context = context;
        _cacheService = cacheService;
    }

    public async Task<List<EquipmentDto>> Handle(GetEquipmentListQuery request, CancellationToken cancellationToken)
    {
        var cacheKey = "equipment:list";
        if (!request.Status.HasValue && string.IsNullOrEmpty(request.Type))
        {
            var cached = await _cacheService.GetAsync<List<EquipmentDto>>(cacheKey, cancellationToken);
            if (cached != null) return cached;
        }

        var query = _context.Equipment
            .Where(e => e.IsActive)
            .AsQueryable();

        if (request.Status.HasValue)
            query = query.Where(e => e.Status == request.Status.Value);

        if (!string.IsNullOrEmpty(request.Type))
            query = query.Where(e => e.Type == request.Type);

        var equipments = await query
            .OrderBy(e => e.Code)
            .Select(e => new EquipmentDto
            {
                Id = e.Id,
                Name = e.Name,
                Code = e.Code,
                Type = e.Type,
                Status = e.Status,
                Location = e.Location,
                LastMaintenanceDate = e.LastMaintenanceDate,
                NextMaintenanceDate = e.NextMaintenanceDate,
                Remarks = e.Remarks,
                IsActive = e.IsActive
            })
            .ToListAsync(cancellationToken);

        foreach (var equipment in equipments)
        {
            var statusCacheKey = $"equipment:status:{equipment.Id}";
            var cachedStatus = await _cacheService.GetAsync<EquipmentStatus?>(statusCacheKey, cancellationToken);
            if (cachedStatus.HasValue && cachedStatus.Value != equipment.Status)
            {
                equipment.Status = cachedStatus.Value;
            }
        }

        if (!request.Status.HasValue && string.IsNullOrEmpty(request.Type))
        {
            await _cacheService.SetAsync(cacheKey, equipments, TimeSpan.FromMinutes(10), cancellationToken);
        }

        return equipments;
    }
}
