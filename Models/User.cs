namespace DentalClinicApi.Models;

public class User
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "Manager", "Doctor", "Receptionist"

    // Multi-tenancy: كل مستخدم ينتمي لعيادة واحدة
    public int ClinicId { get; set; }
    public Clinic? Clinic { get; set; }

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// Enum للأدوار (يمكن استخدامه للتحقق)
public static class UserRoles
{
    public const string Manager = "Manager";
    public const string Doctor = "Doctor";
    public const string Receptionist = "Receptionist";
}
