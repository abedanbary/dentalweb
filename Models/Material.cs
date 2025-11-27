namespace DentalClinicApi.Models;

public class Material
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty; // e.g., "box", "piece", "ml"
    public decimal Price { get; set; }
    public int MinimumStock { get; set; } = 10;
    public string? Supplier { get; set; }

    // Multi-tenancy: Each material belongs to a clinic
    public int ClinicId { get; set; }
    public Clinic Clinic { get; set; } = null!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastRestocked { get; set; }
}
