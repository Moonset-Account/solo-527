namespace CarWash.Domain.Entities;

public class Customer : BaseEntity
{
    public string Phone { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public Guid? MemberPackageId { get; set; }
    public MemberPackage? MemberPackage { get; set; }
    public ICollection<Appointment> Appointments { get; set; } = new List<Appointment>();
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
}
