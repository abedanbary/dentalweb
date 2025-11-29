using Microsoft.EntityFrameworkCore;
using DentalClinicApi.Models;

namespace DentalClinicApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Clinic> Clinics { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<Material> Materials { get; set; }
    public DbSet<MaterialTransaction> MaterialTransactions { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // إعداد العلاقات (Relationships)
        modelBuilder.Entity<User>()
            .HasOne(u => u.Clinic)
            .WithMany(c => c.Users)
            .HasForeignKey(u => u.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Patient>()
            .HasOne(p => p.Clinic)
            .WithMany(c => c.Patients)
            .HasForeignKey(p => p.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Material>()
            .HasOne(m => m.Clinic)
            .WithMany()
            .HasForeignKey(m => m.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MaterialTransaction>()
            .HasOne(mt => mt.Material)
            .WithMany()
            .HasForeignKey(mt => mt.MaterialId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MaterialTransaction>()
            .HasOne(mt => mt.Clinic)
            .WithMany()
            .HasForeignKey(mt => mt.ClinicId)
            .OnDelete(DeleteBehavior.Restrict);

        // Make Email unique
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // Make Material Name unique per clinic
        modelBuilder.Entity<Material>()
            .HasIndex(m => new { m.Name, m.ClinicId })
            .IsUnique();
    }
}
