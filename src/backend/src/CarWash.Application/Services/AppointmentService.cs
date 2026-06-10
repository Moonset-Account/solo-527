using CarWash.Application.DTOs;
using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;

namespace CarWash.Application.Services;

public class AppointmentService : IAppointmentService
{
    private readonly IRepository<Appointment> _appointmentRepository;
    private readonly IRepository<Customer> _customerRepository;
    private readonly IRepository<ServicePackage> _servicePackageRepository;
    private readonly IAuditLogService _auditLogService;
    private readonly IRedisCacheService _cacheService;

    public AppointmentService(
        IRepository<Appointment> appointmentRepository,
        IRepository<Customer> customerRepository,
        IRepository<ServicePackage> servicePackageRepository,
        IAuditLogService auditLogService,
        IRedisCacheService cacheService)
    {
        _appointmentRepository = appointmentRepository;
        _customerRepository = customerRepository;
        _servicePackageRepository = servicePackageRepository;
        _auditLogService = auditLogService;
        _cacheService = cacheService;
    }

    public async Task<AppointmentResponse> CreateAsync(CreateAppointmentRequest request, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
            throw new KeyNotFoundException($"Customer with id {request.CustomerId} not found");

        var servicePackage = await _servicePackageRepository.GetByIdAsync(request.ServicePackageId, cancellationToken);
        if (servicePackage == null)
            throw new KeyNotFoundException($"ServicePackage with id {request.ServicePackageId} not found");

        var appointment = new Appointment
        {
            Id = Guid.NewGuid(),
            CustomerId = request.CustomerId,
            ServicePackageId = request.ServicePackageId,
            AppointmentTime = request.AppointmentTime,
            Status = "pending",
            Notes = request.Notes,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _appointmentRepository.AddAsync(appointment, cancellationToken);

        await _cacheService.RemoveByPatternAsync("appointment:slots:", cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        var appointmentDto = await MapToDto(created, cancellationToken);

        return new AppointmentResponse
        {
            Appointment = appointmentDto,
            PaymentUrl = $"/payments/{created.Id}"
        };
    }

    public async Task<AppointmentDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id, cancellationToken);
        if (appointment == null) return null;

        return await MapToDto(appointment, cancellationToken);
    }

    public async Task<PagedResult<AppointmentDto>> GetListAsync(AppointmentListRequest request, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _appointmentRepository.GetPagedAsync(
            a =>
                (!request.StartDate.HasValue || a.AppointmentTime >= request.StartDate.Value) &&
                (!request.EndDate.HasValue || a.AppointmentTime <= request.EndDate.Value) &&
                (string.IsNullOrEmpty(request.Status) || a.Status == request.Status) &&
                (!request.CustomerId.HasValue || a.CustomerId == request.CustomerId.Value),
            q => q.OrderByDescending(a => a.AppointmentTime),
            request.PageIndex,
            request.PageSize,
            cancellationToken);

        var dtos = new List<AppointmentDto>();
        foreach (var item in items)
        {
            dtos.Add(await MapToDto(item, cancellationToken));
        }

        return new PagedResult<AppointmentDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageIndex = request.PageIndex,
            PageSize = request.PageSize,
            TotalPages = (int)Math.Ceiling((double)totalCount / request.PageSize)
        };
    }

    public async Task<AppointmentDto> UpdateAsync(Guid id, UpdateAppointmentRequest request, CancellationToken cancellationToken = default)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id, cancellationToken);
        if (appointment == null)
            throw new KeyNotFoundException($"Appointment with id {id} not found");

        var oldStatus = appointment.Status;

        if (request.TechnicianId.HasValue)
            appointment.TechnicianId = request.TechnicianId.Value;

        if (request.WorkstationId.HasValue)
            appointment.WorkstationId = request.WorkstationId.Value;

        if (!string.IsNullOrEmpty(request.Status))
            appointment.Status = request.Status;

        if (!string.IsNullOrEmpty(request.Notes))
            appointment.Notes = request.Notes;

        appointment.UpdatedAt = DateTime.UtcNow;

        await _appointmentRepository.UpdateAsync(appointment, cancellationToken);

        if (oldStatus != appointment.Status)
        {
            await _cacheService.RemoveAsync("dashboard:today", cancellationToken);
        }

        return await MapToDto(appointment, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id, cancellationToken);
        if (appointment == null) return false;

        await _appointmentRepository.DeleteAsync(appointment, cancellationToken);
        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return true;
    }

    public async Task<AppointmentDto> UpdateStatusAsync(Guid id, string status, Guid operatorId, string operatorName,
        CancellationToken cancellationToken = default)
    {
        var appointment = await _appointmentRepository.GetByIdAsync(id, cancellationToken);
        if (appointment == null)
            throw new KeyNotFoundException($"Appointment with id {id} not found");

        var oldStatus = appointment.Status;
        appointment.Status = status;
        appointment.UpdatedAt = DateTime.UtcNow;

        await _appointmentRepository.UpdateAsync(appointment, cancellationToken);

        await _auditLogService.LogAsync(
            "appointment",
            id,
            "status_changed",
            oldStatus,
            status,
            operatorId,
            operatorName,
            null,
            cancellationToken);

        await _cacheService.RemoveAsync("dashboard:today", cancellationToken);

        return await MapToDto(appointment, cancellationToken);
    }

    public async Task<List<AppointmentDto>> GetTodayAppointmentsAsync(CancellationToken cancellationToken = default)
    {
        var todayStart = DateTime.Today;
        var todayEnd = todayStart.AddDays(1);

        var appointments = await _appointmentRepository.GetAsync(
            a => a.AppointmentTime >= todayStart && a.AppointmentTime < todayEnd,
            cancellationToken);

        var ordered = appointments.OrderBy(a => a.AppointmentTime).ToList();

        var dtos = new List<AppointmentDto>();
        foreach (var appointment in ordered)
        {
            dtos.Add(await MapToDto(appointment, cancellationToken));
        }

        return dtos;
    }

    private async Task<AppointmentDto> MapToDto(Appointment appointment, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(appointment.CustomerId, cancellationToken);
        var servicePackage = await _servicePackageRepository.GetByIdAsync(appointment.ServicePackageId, cancellationToken);

        return new AppointmentDto
        {
            Id = appointment.Id,
            CustomerId = appointment.CustomerId,
            CustomerName = customer?.Name ?? string.Empty,
            CustomerPhone = customer?.Phone ?? string.Empty,
            ServicePackageId = appointment.ServicePackageId,
            ServicePackageName = servicePackage?.Name ?? string.Empty,
            ServicePackagePrice = servicePackage?.Price ?? 0,
            AppointmentTime = appointment.AppointmentTime,
            Status = appointment.Status,
            TechnicianId = appointment.TechnicianId,
            WorkstationId = appointment.WorkstationId,
            Notes = appointment.Notes,
            CreatedAt = appointment.CreatedAt,
            UpdatedAt = appointment.UpdatedAt
        };
    }
}
