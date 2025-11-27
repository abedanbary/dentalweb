using DentalClinicApi.Data;
using DentalClinicApi.Models;
using DentalClinicApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DentalClinicApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPasswordService _passwordService;

    public SeedController(AppDbContext context, IPasswordService passwordService)
    {
        _context = context;
        _passwordService = passwordService;
    }

    /// <summary>
    /// Creates test data: 1 Clinic with 1 Manager
    /// DELETE THIS ENDPOINT IN PRODUCTION!
    /// </summary>
    [HttpPost("create-test-data")]
    public async Task<IActionResult> CreateTestData()
    {
        // Check if clinic already exists
        var existingClinic = await _context.Clinics.FirstOrDefaultAsync();
        if (existingClinic != null)
        {
            return BadRequest(new { message = "Test data already exists. Clear database first." });
        }

        // Create Clinic
        var clinic = new Clinic
        {
            Name = "Test Dental Clinic",
            Address = "123 Test Street, Test City",
            Phone = "+1234567890"
        };

        _context.Clinics.Add(clinic);
        await _context.SaveChangesAsync();

        // Create Manager
        var manager = new User
        {
            FullName = "Admin Manager",
            Email = "admin@clinic.com",
            PasswordHash = _passwordService.HashPassword("Admin123!"),
            Role = UserRoles.Manager,
            ClinicId = clinic.Id,
            IsActive = true
        };

        _context.Users.Add(manager);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Test data created successfully!",
            clinic = new { clinic.Id, clinic.Name },
            manager = new
            {
                manager.Id,
                manager.FullName,
                manager.Email,
                Password = "Admin123!",
                manager.Role
            },
            loginInstructions = "Use POST /api/auth/login with email: admin@clinic.com, password: Admin123!"
        });
    }
}
