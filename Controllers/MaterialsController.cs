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

    private string GetUserName()
    {
        return User.Identity?.Name ?? User.FindFirst(ClaimTypes.Email)?.Value ?? "System";
    }

    private async Task CreateTransaction(int materialId, string type, int quantity, int balanceAfter,
        decimal? unitCost = null, string? supplier = null, string? notes = null)
    {
        var transaction = new MaterialTransaction
        {
            MaterialId = materialId,
            ClinicId = GetClinicId(),
            TransactionType = type,
            Quantity = quantity,
            BalanceAfter = balanceAfter,
            UnitCost = unitCost,
            Supplier = supplier,
            Notes = notes,
            PerformedBy = GetUserName(),
            CreatedAt = DateTime.UtcNow
        };

        _context.MaterialTransactions.Add(transaction);
        await _context.SaveChangesAsync();
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

    // GET: api/materials/5/transactions
    [HttpGet("{id}/transactions")]
    public async Task<ActionResult<IEnumerable<MaterialTransaction>>> GetMaterialTransactions(int id)
    {
        var clinicId = GetClinicId();

        // Verify material exists and belongs to this clinic
        var material = await _context.Materials
            .FirstOrDefaultAsync(m => m.Id == id && m.ClinicId == clinicId);

        if (material == null)
        {
            return NotFound();
        }

        var transactions = await _context.MaterialTransactions
            .Where(mt => mt.MaterialId == id && mt.ClinicId == clinicId)
            .OrderByDescending(mt => mt.CreatedAt)
            .ToListAsync();

        return Ok(transactions);
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

        // Check if material with same name already exists
        var existingMaterial = await _context.Materials
            .FirstOrDefaultAsync(m => m.Name == material.Name && m.ClinicId == clinicId);

        if (existingMaterial != null)
        {
            return BadRequest(new {
                message = $"Material '{material.Name}' already exists. Please edit the existing material or add stock to it instead.",
                existingMaterialId = existingMaterial.Id
            });
        }

        material.ClinicId = clinicId;
        material.CreatedAt = DateTime.UtcNow;

        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        // Create initial transaction record
        await CreateTransaction(
            material.Id,
            TransactionTypes.Restock,
            material.Quantity,
            material.Quantity,
            material.Price > 0 ? material.Price : null,
            material.Supplier,
            "Initial stock"
        );

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

        var oldQuantity = existingMaterial.Quantity;

        existingMaterial.Name = material.Name;
        existingMaterial.Description = material.Description;
        existingMaterial.Quantity = material.Quantity;
        existingMaterial.Unit = material.Unit;
        existingMaterial.Price = material.Price;
        existingMaterial.MinimumStock = material.MinimumStock;
        existingMaterial.Supplier = material.Supplier;
        existingMaterial.LastRestocked = material.LastRestocked;

        await _context.SaveChangesAsync();

        // Create transaction if quantity changed
        if (oldQuantity != material.Quantity)
        {
            var quantityDiff = material.Quantity - oldQuantity;
            await CreateTransaction(
                id,
                TransactionTypes.Adjustment,
                quantityDiff,
                material.Quantity,
                notes: $"Manual adjustment from {oldQuantity} to {material.Quantity}"
            );
        }

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
    public async Task<IActionResult> RestockMaterial(int id, [FromBody] RestockRequest request)
    {
        var clinicId = GetClinicId();
        var material = await _context.Materials
            .FirstOrDefaultAsync(m => m.Id == id && m.ClinicId == clinicId);

        if (material == null)
        {
            return NotFound();
        }

        material.Quantity += request.Quantity;
        material.LastRestocked = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Create transaction record
        await CreateTransaction(
            id,
            TransactionTypes.Restock,
            request.Quantity,
            material.Quantity,
            request.UnitCost,
            request.Supplier,
            request.Notes
        );

        return Ok(new { material.Quantity, material.LastRestocked });
    }
}

// DTO for restock requests
public class RestockRequest
{
    public int Quantity { get; set; }
    public decimal? UnitCost { get; set; }
    public string? Supplier { get; set; }
    public string? Notes { get; set; }
}
