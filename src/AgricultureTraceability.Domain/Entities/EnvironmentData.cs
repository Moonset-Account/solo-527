namespace AgricultureTraceability.Domain.Entities;

public class EnvironmentData
{
    public Guid Id { get; set; }
    public Guid PlotId { get; set; }
    public Plot? Plot { get; set; }
    public DateTime RecordedAt { get; set; }
    public decimal Temperature { get; set; }
    public decimal Humidity { get; set; }
    public decimal SoilMoisture { get; set; }
    public decimal LightIntensity { get; set; }
    public decimal Co2Level { get; set; }
}
