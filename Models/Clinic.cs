namespace DentalClinicApi.Models;

public class Clinic
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property: العيادة لديها مستخدمين
    public ICollection<User> Users { get; set; } = new List<User>();

    // Navigation property: العيادة لديها مرضى
    public ICollection<Patient> Patients { get; set; } = new List<Patient>();
}
