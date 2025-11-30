using DentalClinicApi.Data;
using DentalClinicApi.Models;
using DentalClinicApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace DentalClinicApi.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPasswordService _passwordService;

    public UsersController(AppDbContext context, IPasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    private int GetClinicId()
    {
        var clinicIdClaim = User.FindFirst("ClinicId")?.Value;
        return int.Parse(clinicIdClaim!);
    }

    private string GetUserName()
    {
        return User.FindFirst(ClaimTypes.Name)?.Value ?? "System";
    }

    // GET: api/users/doctors
    [HttpGet("doctors")]
    public async Task<ActionResult<IEnumerable<object>>> GetDoctors()
    {
        var clinicId = GetClinicId();

        var doctors = await _context.Users
            .Where(u => u.ClinicId == clinicId && u.Role == UserRoles.Doctor)
            .Select(u => new
            {
                u.Id,
                u.FullName,
                u.Email,
                u.Phone,
                u.IsActive,
                u.CreatedAt
            })
            .OrderBy(u => u.FullName)
            .ToListAsync();

        return Ok(doctors);
    }

    // POST: api/users/doctors
    [HttpPost("doctors")]
    public async Task<ActionResult<User>> CreateDoctor([FromBody] CreateDoctorDto dto)
    {
        var clinicId = GetClinicId();

        // Check if email already exists in this clinic
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email && u.ClinicId == clinicId);

        if (existingUser != null)
        {
            return BadRequest(new { message = $"A user with email '{dto.Email}' already exists in your clinic." });
        }

        // Hash the password
        var passwordHash = _passwordService.HashPassword(dto.Password);

        // Create the new doctor
        var doctor = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            Phone = dto.Phone,
            PasswordHash = passwordHash,
            Role = UserRoles.Doctor,
            ClinicId = clinicId,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(doctor);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetDoctors), new { id = doctor.Id }, new
        {
            doctor.Id,
            doctor.FullName,
            doctor.Email,
            doctor.Phone,
            doctor.IsActive,
            doctor.CreatedAt
        });
    }

    // PUT: api/users/doctors/{id}
    [HttpPut("doctors/{id}")]
    public async Task<IActionResult> UpdateDoctor(int id, [FromBody] UpdateDoctorDto dto)
    {
        var clinicId = GetClinicId();

        var doctor = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.ClinicId == clinicId && u.Role == UserRoles.Doctor);

        if (doctor == null)
        {
            return NotFound(new { message = "Doctor not found" });
        }

        // Check if new email conflicts with another user
        if (dto.Email != doctor.Email)
        {
            var emailExists = await _context.Users
                .AnyAsync(u => u.Email == dto.Email && u.ClinicId == clinicId && u.Id != id);

            if (emailExists)
            {
                return BadRequest(new { message = $"A user with email '{dto.Email}' already exists in your clinic." });
            }
        }

        // Update fields
        doctor.FullName = dto.FullName;
        doctor.Email = dto.Email;
        doctor.Phone = dto.Phone;

        // Only update password if a new one is provided
        if (!string.IsNullOrEmpty(dto.Password))
        {
            doctor.PasswordHash = _passwordService.HashPassword(dto.Password);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            doctor.Id,
            doctor.FullName,
            doctor.Email,
            doctor.Phone,
            doctor.IsActive,
            doctor.CreatedAt
        });
    }

    // DELETE: api/users/doctors/{id}
    [HttpDelete("doctors/{id}")]
    public async Task<IActionResult> DeleteDoctor(int id)
    {
        var clinicId = GetClinicId();

        var doctor = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id && u.ClinicId == clinicId && u.Role == UserRoles.Doctor);

        if (doctor == null)
        {
            return NotFound(new { message = "Doctor not found" });
        }

        // Soft delete by setting IsActive to false
        doctor.IsActive = false;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Doctor deactivated successfully" });
    }
}

// DTOs
public class CreateDoctorDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

public class UpdateDoctorDto
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Password { get; set; }
}
