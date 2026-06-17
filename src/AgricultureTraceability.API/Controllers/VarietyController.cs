using AgricultureTraceability.Domain.Entities;
using AgricultureTraceability.Infrastructure.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace AgricultureTraceability.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class VarietyController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;

    public VarietyController(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Variety>>> GetAll()
    {
        var varieties = await _unitOfWork.Varieties.GetAllAsync();
        return Ok(varieties);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Variety>> GetById(Guid id)
    {
        var variety = await _unitOfWork.Varieties.GetByIdAsync(id);
        if (variety == null)
        {
            return NotFound();
        }
        return Ok(variety);
    }

    [HttpPost]
    public async Task<ActionResult<Variety>> Create([FromBody] Variety variety)
    {
        variety.Id = Guid.NewGuid();
        variety.CreatedAt = DateTime.UtcNow;
        var result = await _unitOfWork.Varieties.AddAsync(variety);
        await _unitOfWork.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Variety>> Update(Guid id, [FromBody] Variety variety)
    {
        var existing = await _unitOfWork.Varieties.GetByIdAsync(id);
        if (existing == null)
        {
            return NotFound();
        }
        existing.Name = variety.Name;
        existing.Category = variety.Category;
        existing.GrowthDays = variety.GrowthDays;
        existing.Description = variety.Description;
        existing.IsActive = variety.IsActive;
        _unitOfWork.Varieties.Update(existing);
        await _unitOfWork.SaveChangesAsync();
        return Ok(existing);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var existing = await _unitOfWork.Varieties.GetByIdAsync(id);
        if (existing == null)
        {
            return NotFound();
        }
        _unitOfWork.Varieties.Delete(existing);
        await _unitOfWork.SaveChangesAsync();
        return NoContent();
    }
}
