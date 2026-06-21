using ProcessScheduling.Application.DTOs;

namespace ProcessScheduling.Application.Interfaces;

public interface IProcessStepService
{
    Task<ProcessStepInstanceDto?> GetByQrCodeAsync(string qrCode);
    Task<ProcessStepInstanceDto> ScanStartAsync(ScanCodeRequestDto request);
    Task<ProcessStepInstanceDto> ScanCompleteAsync(string qrCode, int outputQuantity, int defectiveQuantity, string? remark = null);
    Task<ProcessStepInstanceDto> ReportAbnormalAsync(string qrCode, string reason, Guid operatorId);
    Task<IEnumerable<ProcessStepInstanceDto>> GetByWorkOrderAsync(Guid workOrderId);
    Task<ProcessStepInstanceDto?> GetByIdAsync(Guid id);
}
