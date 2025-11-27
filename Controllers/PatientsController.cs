using DentalClinicApi.Data;
using DentalClinicApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DentalClinicApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PatientsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PatientsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/patients
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Patient>>> GetAll()
    {
        var patients = await _context.Patients.ToListAsync();
        return Ok(patients);
    }

    // GET: api/patients/5
    [HttpGet("{id:int}")]
    public async Task<ActionResult<Patient>> GetById(int id)
    {
        var patient = await _context.Patients.FindAsync(id);

        if (patient == null)
            return NotFound();

        return Ok(patient);
    }

    // POST: api/patients
    [HttpPost]
    public async Task<ActionResult<Patient>> Create([FromBody] Patient patient)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _context.Patients.Add(patient);
        await _context.SaveChangesAsync();

        // يرجع 201 + رابط للـ GET by id
        return CreatedAtAction(nameof(GetById), new { id = patient.Id }, patient);
    }

    // PUT: api/patients/5
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] Patient updatedPatient)
    {
        if (id != updatedPatient.Id)
            return BadRequest("ID in URL and body do not match.");

        var existing = await _context.Patients.FindAsync(id);
        if (existing == null)
            return NotFound();

        existing.FullName = updatedPatient.FullName;
        existing.Phone = updatedPatient.Phone;
        existing.Notes = updatedPatient.Notes;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    // DELETE: api/patients/5
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var patient = await _context.Patients.FindAsync(id);
        if (patient == null)
            return NotFound();

        _context.Patients.Remove(patient);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
