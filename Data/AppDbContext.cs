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

        // جعل Email فريد (Unique)
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
    }
}
