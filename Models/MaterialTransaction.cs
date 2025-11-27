namespace DentalClinicApi.Models;

public class MaterialTransaction
{
    public int Id { get; set; }
    public int MaterialId { get; set; }
    public Material? Material { get; set; }

    public string TransactionType { get; set; } = string.Empty; // "Restock", "Usage", "Adjustment"
    public int Quantity { get; set; } // Positive for additions, negative for usage
    public int BalanceAfter { get; set; } // Stock level after this transaction

    public decimal? UnitCost { get; set; } // Cost per unit for this transaction
    public string? Supplier { get; set; } // Supplier for restock transactions
    public string? Notes { get; set; }
    public string? PerformedBy { get; set; } // User who performed the transaction

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Multi-tenancy
    public int ClinicId { get; set; }
    public Clinic? Clinic { get; set; }
}

public static class TransactionTypes
{
    public const string Restock = "Restock";
    public const string Usage = "Usage";
    public const string Adjustment = "Adjustment";
}
