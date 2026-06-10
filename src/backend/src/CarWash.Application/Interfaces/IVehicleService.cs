using CarWash.Application.DTOs;

namespace CarWash.Application.Interfaces;

public interface IVehicleService
{
    Task<VehicleDto> CreateAsync(CreateVehicleRequest request, CancellationToken cancellationToken = default);
    Task<VehicleDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<VehicleDto>> GetByCustomerIdAsync(Guid customerId, CancellationToken cancellationToken = default);
    Task<VehicleDto?> GetByPlateNumberAsync(string plateNumber, CancellationToken cancellationToken = default);
    Task<VehicleDto> UpdateAsync(Guid id, UpdateVehicleRequest request, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    Task<List<VehicleServiceRecordDto>> GetServiceRecordsAsync(Guid vehicleId, CancellationToken cancellationToken = default);
}
