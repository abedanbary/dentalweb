using Microsoft.EntityFrameworkCore;
using DentalClinicApi.Models;

namespace DentalClinicApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Patient> Patients { get; set; }
}
