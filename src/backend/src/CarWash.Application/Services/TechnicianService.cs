using CarWash.Application.DTOs;
using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;

namespace CarWash.Application.Services;

public class TechnicianService : ITechnicianService
{
    private readonly IRepository<Technician> _technicianRepository;
    private readonly IRepository<Workstation> _workstationRepository;
    private readonly IRedisCacheService _cacheService;
    private readonly IAuditLogService _auditLogService;

    public TechnicianService(
        IRepository<Technician> technicianRepository,
        IRepository<Workstation> workstationRepository,
        IRedisCacheService cacheService,
        IAuditLogService auditLogService)
    {
        _technicianRepository = technicianRepository;
        _workstationRepository = workstationRepository;
        _cacheService = cacheService;
        _auditLogService = auditLogService;
    }

    public async Task<TechnicianDto> CreateAsync(CreateTechnicianRequest request, CancellationToken cancellationToken = default)
    {
        var technician = new Technician
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Specialties = string.Join(",", request.Specialties),
            Status = "available",
            CapacityDay = request.CapacityDay,
            CapacityUsed = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _technicianRepository.AddAsync(technician, cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return await MapToDto(created, cancellationToken);
    }

    public async Task<TechnicianDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"technician:status:{id}";
        var cached = await _cacheService.GetAsync<TechnicianDto>(cacheKey, cancellationToken);
        if (cached != null) return cached;

        var technician = await _technicianRepository.GetByIdAsync(id, cancellationToken);
        if (technician == null) return null;

        var dto = await MapToDto(technician, cancellationToken);
        await _cacheService.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(5), cancellationToken);

        return dto;
    }

    public async Task<List<TechnicianDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var technicians = await _technicianRepository.GetAllAsync(cancellationToken);
        var dtos = new List<TechnicianDto>();

        foreach (var tech in technicians)
        {
            dtos.Add(await MapToDto(tech, cancellationToken));
        }

        return dtos.OrderBy(t => t.Name).ToList();
    }

    public async Task<TechnicianDto> UpdateAsync(Guid id, UpdateTechnicianRequest request, CancellationToken cancellationToken = default)
    {
        var technician = await _technicianRepository.GetByIdAsync(id, cancellationToken);
        if (technician == null)
            throw new KeyNotFoundException($"Technician with id {id} not found");

        if (!string.IsNullOrEmpty(request.Name))
            technician.Name = request.Name;

        if (request.Specialties != null)
            technician.Specialties = string.Join(",", request.Specialties);

        if (!string.IsNullOrEmpty(request.Status))
            technician.Status = request.Status;

        if (request.CapacityDay.HasValue)
            technician.CapacityDay = request.CapacityDay.Value;

        technician.UpdatedAt = DateTime.UtcNow;

        await _technicianRepository.UpdateAsync(technician, cancellationToken);
        await _cacheService.RemoveAsync($"technician:status:{id}", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return await MapToDto(technician, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var technician = await _technicianRepository.GetByIdAsync(id, cancellationToken);
        if (technician == null) return false;

        await _technicianRepository.DeleteAsync(technician, cancellationToken);
        await _cacheService.RemoveAsync($"technician:status:{id}", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return true;
    }

    public async Task<List<TechnicianDto>> GetAvailableTechniciansAsync(CancellationToken cancellationToken = default)
    {
        var technicians = await _technicianRepository.GetAsync(
            t => t.Status == "available",
            cancellationToken);

        var dtos = new List<TechnicianDto>();
        foreach (var tech in technicians)
        {
            dtos.Add(await MapToDto(tech, cancellationToken));
        }

        return dtos.OrderBy(t => t.Name).ToList();
    }

    public async Task<TechnicianDto> UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        var technician = await _technicianRepository.GetByIdAsync(id, cancellationToken);
        if (technician == null)
            throw new KeyNotFoundException($"Technician with id {id} not found");

        var oldStatus = technician.Status;
        technician.Status = status;
        technician.UpdatedAt = DateTime.UtcNow;

        await _technicianRepository.UpdateAsync(technician, cancellationToken);
        await _cacheService.RemoveAsync($"technician:status:{id}", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return await MapToDto(technician, cancellationToken);
    }

    private async Task<TechnicianDto> MapToDto(Technician technician, CancellationToken cancellationToken = default)
    {
        Workstation? workstation = null;
        if (technician.CurrentWorkstationId.HasValue)
        {
            workstation = await _workstationRepository.GetByIdAsync(technician.CurrentWorkstationId.Value, cancellationToken);
        }

        return new TechnicianDto
        {
            Id = technician.Id,
            Name = technician.Name,
            Specialties = technician.Specialties.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
            Status = technician.Status,
            CurrentWorkstationId = technician.CurrentWorkstationId,
            CurrentWorkstationName = workstation?.Name,
            CapacityDay = technician.CapacityDay,
            CapacityUsed = technician.CapacityUsed
        };
    }
}
