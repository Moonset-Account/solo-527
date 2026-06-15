
using MediatR;
using Microsoft.AspNetCore.Mvc;
using PrintingFactory.Application.DTOs;
using PrintingFactory.Domain.Entities;
using PrintingFactory.Infrastructure.Data;

namespace PrintingFactory.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StoresController : ControllerBase
{
    private readonly PrintingFactoryDbContext _context;

    public StoresController(PrintingFactoryDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<StoreDto>>> GetList()
    {
        var stores = _context.Stores
            .Where(s => s.IsActive)
            .Select(s => new StoreDto
            {
                Id = s.Id,
                Name = s.Name,
                ContactPerson = s.ContactPerson,
                Phone = s.Phone,
                Address = s.Address,
                IsActive = s.IsActive,
                OrderCount = s.Orders.Count,
                TotalAmount = s.Orders.Sum(o => o.TotalAmount)
            })
            .ToList();

        return Ok(stores);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StoreDto>> GetById(int id)
    {
        var store = await _context.Stores.FindAsync(id);
        if (store == null) return NotFound();

        return new StoreDto
        {
            Id = store.Id,
            Name = store.Name,
            ContactPerson = store.ContactPerson,
            Phone = store.Phone,
            Address = store.Address,
            IsActive = store.IsActive
        };
    }

    [HttpPost]
    public async Task<ActionResult<StoreDto>> Create([FromBody] StoreDto dto)
    {
        var store = new Store
        {
            Name = dto.Name,
            ContactPerson = dto.ContactPerson,
            Phone = dto.Phone,
            Address = dto.Address,
            IsActive = dto.IsActive
        };

        _context.Stores.Add(store);
        await _context.SaveChangesAsync();

        dto.Id = store.Id;
        return CreatedAtAction(nameof(GetById), new { id = store.Id }, dto);
    }
}
