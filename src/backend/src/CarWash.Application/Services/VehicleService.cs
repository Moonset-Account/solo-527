using CarWash.Application.DTOs;
using CarWash.Application.Interfaces;
using CarWash.Domain.Entities;

namespace CarWash.Application.Services;

public class VehicleService : IVehicleService
{
    private readonly IRepository<Vehicle> _vehicleRepository;
    private readonly IRepository<Customer> _customerRepository;
    private readonly IRepository<VehicleServiceRecord> _serviceRecordRepository;

    public VehicleService(
        IRepository<Vehicle> vehicleRepository,
        IRepository<Customer> customerRepository,
        IRepository<VehicleServiceRecord> serviceRecordRepository)
    {
        _vehicleRepository = vehicleRepository;
        _customerRepository = customerRepository;
        _serviceRecordRepository = serviceRecordRepository;
    }

    public async Task<VehicleDto> CreateAsync(CreateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(request.CustomerId, cancellationToken);
        if (customer == null)
            throw new KeyNotFoundException($"Customer with id {request.CustomerId} not found");

        var existing = await _vehicleRepository.FirstOrDefaultAsync(
            v => v.PlateNumber == request.PlateNumber,
            cancellationToken);

        if (existing != null)
            throw new InvalidOperationException($"Vehicle with plate number {request.PlateNumber} already exists");

        var vehicle = new Vehicle
        {
            Id = Guid.NewGuid(),
            PlateNumber = request.PlateNumber,
            Brand = request.Brand,
            Model = request.Model,
            Color = request.Color,
            Vin = request.Vin,
            CustomerId = request.CustomerId,
            Notes = request.Notes,
            Tags = request.Tags.Count > 0 ? string.Join(",", request.Tags) : null,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var created = await _vehicleRepository.AddAsync(vehicle, cancellationToken);

        return await MapToDto(created, cancellationToken);
    }

    public async Task<VehicleDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, cancellationToken);
        if (vehicle == null) return null;

        return await MapToDto(vehicle, cancellationToken);
    }

    public async Task<List<VehicleDto>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default)
    {
        var vehicles = await _vehicleRepository.GetAsync(
            v => v.CustomerId == customerId,
            cancellationToken);

        var dtos = new List<VehicleDto>();
        foreach (var vehicle in vehicles)
        {
            dtos.Add(await MapToDto(vehicle, cancellationToken));
        }

        return dtos.OrderBy(v => v.PlateNumber).ToList();
    }

    public async Task<VehicleDto?> GetByPlateNumberAsync(string plateNumber, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.FirstOrDefaultAsync(
            v => v.PlateNumber == plateNumber,
            cancellationToken);

        return vehicle == null ? null : await MapToDto(vehicle, cancellationToken);
    }

    public async Task<VehicleDto> UpdateAsync(Guid id, UpdateVehicleRequest request, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, cancellationToken);
        if (vehicle == null)
            throw new KeyNotFoundException($"Vehicle with id {id} not found");

        if (!string.IsNullOrEmpty(request.Brand))
            vehicle.Brand = request.Brand;

        if (!string.IsNullOrEmpty(request.Model))
            vehicle.Model = request.Model;

        if (!string.IsNullOrEmpty(request.Color))
            vehicle.Color = request.Color;

        if (request.Vin != null)
            vehicle.Vin = request.Vin;

        if (request.Notes != null)
            vehicle.Notes = request.Notes;

        if (request.Tags != null)
            vehicle.Tags = request.Tags.Count > 0 ? string.Join(",", request.Tags) : null;

        vehicle.UpdatedAt = DateTime.UtcNow;

        await _vehicleRepository.UpdateAsync(vehicle, cancellationToken);

        return await MapToDto(vehicle, cancellationToken);
    }

    public async Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var vehicle = await _vehicleRepository.GetByIdAsync(id, cancellationToken);
        if (vehicle == null) return false;

        await _vehicleRepository.DeleteAsync(vehicle, cancellationToken);
        return true;
    }

    public async Task<List<VehicleServiceRecordDto>> GetServiceRecordsAsync(Guid vehicleId, CancellationToken cancellationToken = default)
    {
        var records = await _serviceRecordRepository.GetAsync(
            r => r.VehicleId == vehicleId,
            cancellationToken);

        return records.OrderByDescending(r => r.CompletedAt)
                      .Select(r => new VehicleServiceRecordDto
                      {
                          Id = r.Id,
                          VehicleId = r.VehicleId,
                          AppointmentId = r.AppointmentId,
                          ServiceName = r.ServiceName,
                          TechnicianName = r.TechnicianName,
                          CompletedAt = r.CompletedAt,
                          Notes = r.Notes
                      })
                      .ToList();
    }

    private async Task<VehicleDto> MapToDto(Vehicle vehicle, CancellationToken cancellationToken = default)
    {
        var customer = await _customerRepository.GetByIdAsync(vehicle.CustomerId, cancellationToken);

        return new VehicleDto
        {
            Id = vehicle.Id,
            PlateNumber = vehicle.PlateNumber,
            Brand = vehicle.Brand,
            Model = vehicle.Model,
            Color = vehicle.Color,
            Vin = vehicle.Vin,
            CustomerId = vehicle.CustomerId,
            CustomerName = customer?.Name ?? string.Empty,
            Notes = vehicle.Notes,
            Tags = string.IsNullOrEmpty(vehicle.Tags)
                ? new List<string>()
                : vehicle.Tags.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
            CreatedAt = vehicle.CreatedAt
        };
    }
}
