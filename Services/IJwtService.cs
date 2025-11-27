using DentalClinicApi.Models;

namespace DentalClinicApi.Services;

public interface IJwtService
{
    string GenerateToken(User user, string clinicName);
}
