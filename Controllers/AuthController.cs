using DentalClinicApi.Data;
using DentalClinicApi.DTOs;
using DentalClinicApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DentalClinicApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPasswordService _passwordService;
    private readonly IJwtService _jwtService;

    public AuthController(
        AppDbContext context,
        IPasswordService passwordService,
        IJwtService jwtService)
    {
        _context = context;
        _passwordService = passwordService;
        _jwtService = jwtService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        // البحث عن المستخدم مع بيانات العيادة
        var user = await _context.Users
            .Include(u => u.Clinic)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // التحقق من أن المستخدم نشط
        if (!user.IsActive)
        {
            return Unauthorized(new { message = "Account is inactive. Please contact your administrator." });
        }

        // التحقق من كلمة المرور
        if (!_passwordService.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password" });
        }

        // إنشاء JWT Token
        var token = _jwtService.GenerateToken(user, user.Clinic.Name);

        var response = new LoginResponseDto
        {
            Token = token,
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            ClinicId = user.ClinicId,
            ClinicName = user.Clinic.Name
        };

        return Ok(response);
    }
}
