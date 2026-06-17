using AgricultureTraceability.Domain.Entities;

namespace AgricultureTraceability.Domain.Interfaces;

public interface IQrCodeService
{
    Task<string> GenerateQrContentAsync(HarvestBatch batch);
    Task<byte[]> GenerateQrImageAsync(string content, int pixelsPerModule = 10);
}
