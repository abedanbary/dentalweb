namespace DentalClinicApi.Models;

public class Patient
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Notes { get; set; }

    // Multi-tenancy: كل مريض ينتمي لعيادة واحدة
    public int ClinicId { get; set; }
    public Clinic Clinic { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
