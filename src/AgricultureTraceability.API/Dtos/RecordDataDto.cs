namespace AgricultureTraceability.API.Dtos;

public class RecordDataDto
{
    public Guid PlotId { get; set; }
    public decimal Temperature { get; set; }
    public decimal Humidity { get; set; }
    public decimal SoilMoisture { get; set; }
    public decimal LightIntensity { get; set; }
    public decimal Co2Level { get; set; }
}
