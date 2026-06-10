using Microsoft.AspNetCore.Mvc;

namespace CarWash.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VehiclesController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? keyword = null)
    {
        var result = new
        {
            items = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    plateNumber = "京A12345",
                    brand = "丰田",
                    model = "凯美瑞",
                    color = "白色",
                    vin = "12345678901234567",
                    customerId = Guid.NewGuid().ToString(),
                    notes = "定期保养",
                    tags = new[] { "VIP", "精品" },
                    createdAt = DateTime.Now.AddMonths(-6).ToString("yyyy-MM-ddTHH:mm:ssZ")
                }
            },
            total = 1,
            page,
            pageSize
        };

        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var result = new
        {
            id,
            plateNumber = "京A12345",
            brand = "丰田",
            model = "凯美瑞",
            color = "白色",
            vin = "12345678901234567",
            customerId = Guid.NewGuid().ToString(),
            notes = "定期保养",
            tags = new[] { "VIP", "精品" },
            createdAt = DateTime.Now.AddMonths(-6).ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return Ok(result);
    }

    [HttpGet("plate/{plateNumber}")]
    public async Task<IActionResult> GetByPlateNumber(string plateNumber)
    {
        var result = new
        {
            id = Guid.NewGuid().ToString(),
            plateNumber,
            brand = "丰田",
            model = "凯美瑞",
            color = "白色",
            vin = "12345678901234567",
            customerId = Guid.NewGuid().ToString(),
            notes = "定期保养",
            tags = new[] { "VIP", "精品" },
            createdAt = DateTime.Now.AddMonths(-6).ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return Ok(result);
    }

    [HttpGet("{id}/service-records")]
    public async Task<IActionResult> GetServiceRecords(string id, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = new
        {
            items = new[]
            {
                new
                {
                    id = Guid.NewGuid().ToString(),
                    vehicleId = id,
                    appointmentId = Guid.NewGuid().ToString(),
                    serviceName = "精洗套餐",
                    technicianName = "张师傅",
                    completedAt = DateTime.Now.AddDays(-7).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notes = "服务良好"
                },
                new
                {
                    id = Guid.NewGuid().ToString(),
                    vehicleId = id,
                    appointmentId = Guid.NewGuid().ToString(),
                    serviceName = "内饰清洁",
                    technicianName = "李师傅",
                    completedAt = DateTime.Now.AddDays(-30).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    notes = "车内有异味，已处理"
                }
            },
            total = 2,
            page,
            pageSize
        };

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVehicleRequest request)
    {
        var vehicleId = Guid.NewGuid().ToString();

        var vehicle = new
        {
            id = vehicleId,
            plateNumber = request.PlateNumber,
            brand = request.Brand,
            model = request.Model,
            color = request.Color,
            vin = request.Vin,
            customerId = request.CustomerId,
            notes = request.Notes,
            tags = request.Tags,
            createdAt = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        };

        return CreatedAtAction(nameof(GetById), new { id = vehicleId }, vehicle);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateVehicleRequest request)
    {
        var updated = new
        {
            id,
            plateNumber = request.PlateNumber,
            brand = request.Brand,
            model = request.Model,
            color = request.Color,
            vin = request.Vin,
            notes = request.Notes,
            tags = request.Tags
        };

        return Ok(updated);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        return NoContent();
    }
}

public class CreateVehicleRequest
{
    public string PlateNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Vin { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
}

public class UpdateVehicleRequest
{
    public string PlateNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Vin { get; set; }
    public string? Notes { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
}
