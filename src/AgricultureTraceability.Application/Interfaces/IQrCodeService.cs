using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Application.Interfaces;

public interface IQrCodeService
{
    Task<string> GenerateQrContentAsync(HarvestBatch batch);
    Task<byte[]> GenerateQrImageAsync(string content);
}
