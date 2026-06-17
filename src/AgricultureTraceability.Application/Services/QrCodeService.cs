using System.Text.Json;
using AgricultureTraceability.Application.Interfaces;
using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using QRCoder;

namespace AgricultureTraceability.Application.Services;

public class QrCodeService : IQrCodeService
{
    private readonly IUnitOfWork _unitOfWork;

    public QrCodeService(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<string> GenerateQrContentAsync(HarvestBatch batch)
    {
        var plot = await _unitOfWork.Plots.GetByIdAsync(batch.PlotId);
        var variety = await _unitOfWork.Varieties.GetByIdAsync(batch.VarietyId);

        var content = new
        {
            batchNumber = batch.BatchNumber,
            plotCode = plot?.PlotCode,
            plotName = plot?.Name,
            varietyName = variety?.Name,
            varietyCategory = variety?.Category,
            plantingDate = batch.PlantingDate.ToString("yyyy-MM-dd"),
            harvestDate = batch.HarvestDate?.ToString("yyyy-MM-dd"),
            status = batch.Status.ToString(),
            expectedYield = batch.ExpectedYield,
            actualYield = batch.ActualYield,
            createdAt = batch.CreatedAt.ToString("yyyy-MM-dd HH:mm:ss")
        };

        return JsonSerializer.Serialize(content, new JsonSerializerOptions { WriteIndented = false });
    }

    public Task<byte[]> GenerateQrImageAsync(string content)
    {
        using var qrGenerator = new QRCodeGenerator();
        var qrCodeData = qrGenerator.CreateQrCode(content, QRCodeGenerator.ECCLevel.Q);
        using var qrCode = new PngByteQRCode(qrCodeData);
        var qrCodeImage = qrCode.GetGraphic(20);
        return Task.FromResult(qrCodeImage);
    }
}
