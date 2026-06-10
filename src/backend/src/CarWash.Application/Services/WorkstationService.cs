using CarWash.Application.DTOs;
using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;

namespace CarWash.Application.Services;

public class WorkstationService : IWorkstationService
{
    private readonly IRepository<Workstation> _workstationRepository;
    private readonly IRepository<Technician> _technicianRepository;
    private readonly IRedisCacheService _cacheService;

    public WorkstationService(
        IRepository<Workstation> workstationRepository,
        IRepository<Technician> technicianRepository,
        IRedisCacheService cacheService)
    {
        _workstationRepository = workstationRepository;
        _technicianRepository = technicianRepository;
        _cacheService = cacheService;
    }

    public async Task<WorkstationDto> CreateAsync(CreateWorkstationRequest request, CancellationToken cancellationToken = default)
    {
        var workstation = new Workstation
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Type = request.Type,
            Status = "idle",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _workstationRepository.AddAsync(workstation, cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return await MapToDto(created, cancellationToken);
    }

    public async Task<WorkstationDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"workstation:status:{id}";
        var cached = await _cacheService.GetAsync<WorkstationDto>(cacheKey, cancellationToken);
        if (cached != null) return cached;

        var workstation = await _workstationRepository.GetByIdAsync(id, cancellationToken);
        if (workstation == null) return null;

        var dto = await MapToDto(workstation, cancellationToken);
        await _cacheService.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(5), cancellationToken);

        return dto;
    }

    public async Task<List<WorkstationDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var workstations = await _workstationRepository.GetAllAsync(cancellationToken);
        var dtos = new List<WorkstationDto>();

        foreach (var ws in workstations)
        {
            dtos.Add(await MapToDto(ws, cancellationToken));
        }

        return dtos.OrderBy(w => w.Name).ToList();
    }

    public async Task<WorkstationDto> UpdateAsync(Guid id, UpdateWorkstationRequest request, CancellationToken cancellationToken = default)
    {
        var workstation = await _workstationRepository.GetByIdAsync(id, cancellationToken);
        if (workstation == null)
            throw new KeyNotFoundException($"Workstation with id {id} not found");

        if (!string.IsNullOrEmpty(request.Name))
            workstation.Name = request.Name;

        if (!string.IsNullOrEmpty(request.Type))
            workstation.Type = request.Type;

        if (!string.IsNullOrEmpty(request.Status))
            workstation.Status = request.Status;

        workstation.UpdatedAt = DateTime.UtcNow;

        await _workstationRepository.UpdateAsync(workstation, cancellationToken);
        await _cacheService.RemoveAsync($"workstation:status:{id}", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return await MapToDto(workstation, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var workstation = await _workstationRepository.GetByIdAsync(id, cancellationToken);
        if (workstation == null) return false;

        await _workstationRepository.DeleteAsync(workstation, cancellationToken);
        await _cacheService.RemoveAsync($"workstation:status:{id}", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return true;
    }

    public async Task<List<WorkstationDto>> GetAvailableWorkstationsAsync(CancellationToken cancellationToken = default)
    {
        var workstations = await _workstationRepository.GetAsync(
            w => w.Status == "idle",
            cancellationToken);

        var dtos = new List<WorkstationDto>();
        foreach (var ws in workstations)
        {
            dtos.Add(await MapToDto(ws, cancellationToken));
        }

        return dtos.OrderBy(w => w.Name).ToList();
    }

    public async Task<WorkstationDto> UpdateStatusAsync(Guid id, string status, CancellationToken cancellationToken = default)
    {
        var workstation = await _workstationRepository.GetByIdAsync(id, cancellationToken);
        if (workstation == null)
            throw new KeyNotFoundException($"Workstation with id {id} not found");

        workstation.Status = status;
        workstation.UpdatedAt = DateTime.UtcNow;

        await _workstationRepository.UpdateAsync(workstation, cancellationToken);
        await _cacheService.RemoveAsync($"workstation:status:{id}", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return await MapToDto(workstation, cancellationToken);
    }

    private async Task<WorkstationDto> MapToDto(Workstation workstation, CancellationToken cancellationToken = default)
    {
        Technician? technician = null;
        if (workstation.CurrentTechnicianId.HasValue)
        {
            technician = await _technicianRepository.GetByIdAsync(workstation.CurrentTechnicianId.Value, cancellationToken);
        }

        return new WorkstationDto
        {
            Id = workstation.Id,
            Name = workstation.Name,
            Type = workstation.Type,
            Status = workstation.Status,
            CurrentAppointmentId = workstation.CurrentAppointmentId,
            CurrentTechnicianId = workstation.CurrentTechnicianId,
            CurrentTechnicianName = technician?.Name
        };
    }
}
