using DentalClinicApi.Data;
using DentalClinicApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DentalClinicApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MaterialsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MaterialsController(AppDbContext context)
    {
        _context = context;
    }

    private int GetClinicId()
    {
        var clinicIdClaim = User.FindFirst("ClinicId")?.Value;
        return int.Parse(clinicIdClaim ?? "0");
    }

    // GET: api/materials
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Material>>> GetMaterials()
    {
        var clinicId = GetClinicId();
        var materials = await _context.Materials
            .Where(m => m.ClinicId == clinicId)
            .OrderBy(m => m.Name)
            .ToListAsync();

        return Ok(materials);
    }

    // GET: api/materials/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Material>> GetMaterial(int id)
    {
        var clinicId = GetClinicId();
        var material = await _context.Materials
            .FirstOrDefaultAsync(m => m.Id == id && m.ClinicId == clinicId);

        if (material == null)
        {
            return NotFound();
        }

        return Ok(material);
    }

    // GET: api/materials/low-stock
    [HttpGet("low-stock")]
    public async Task<ActionResult<IEnumerable<Material>>> GetLowStockMaterials()
    {
        var clinicId = GetClinicId();
        var materials = await _context.Materials
            .Where(m => m.ClinicId == clinicId && m.Quantity <= m.MinimumStock)
            .OrderBy(m => m.Quantity)
            .ToListAsync();

        return Ok(materials);
    }

    // POST: api/materials
    [HttpPost]
    public async Task<ActionResult<Material>> CreateMaterial(Material material)
    {
        var clinicId = GetClinicId();
        material.ClinicId = clinicId;
        material.CreatedAt = DateTime.UtcNow;

        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMaterial), new { id = material.Id }, material);
    }

    // PUT: api/materials/5
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMaterial(int id, Material material)
    {
        var clinicId = GetClinicId();

        if (id != material.Id)
        {
            return BadRequest();
        }

        var existingMaterial = await _context.Materials
            .FirstOrDefaultAsync(m => m.Id == id && m.ClinicId == clinicId);

        if (existingMaterial == null)
        {
            return NotFound();
        }

        existingMaterial.Name = material.Name;
        existingMaterial.Description = material.Description;
        existingMaterial.Quantity = material.Quantity;
        existingMaterial.Unit = material.Unit;
        existingMaterial.Price = material.Price;
        existingMaterial.MinimumStock = material.MinimumStock;
        existingMaterial.Supplier = material.Supplier;
        existingMaterial.LastRestocked = material.LastRestocked;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/materials/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMaterial(int id)
    {
        var clinicId = GetClinicId();
        var material = await _context.Materials
            .FirstOrDefaultAsync(m => m.Id == id && m.ClinicId == clinicId);

        if (material == null)
        {
            return NotFound();
        }

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    // POST: api/materials/5/restock
    [HttpPost("{id}/restock")]
    public async Task<IActionResult> RestockMaterial(int id, [FromBody] int quantity)
    {
        var clinicId = GetClinicId();
        var material = await _context.Materials
            .FirstOrDefaultAsync(m => m.Id == id && m.ClinicId == clinicId);

        if (material == null)
        {
            return NotFound();
        }

        material.Quantity += quantity;
        material.LastRestocked = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new { material.Quantity, material.LastRestocked });
    }
}
