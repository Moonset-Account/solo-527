namespace Counseling.Domain.Enums;

public enum AppointmentStatus
{
    Pending = 0,
    Confirmed = 1,
    CheckedIn = 2,
    NoShow = 3,
    Cancelled = 4,
    Completed = 5
}

public enum UserRole
{
    Client = 0,
    Counselor = 1,
    Receptionist = 2,
    Manager = 3,
    Admin = 4
}

public enum ServiceStatus
{
    Active = 0,
    Inactive = 1,
    Discontinued = 2
}

public enum RefundStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Completed = 3
}

public enum ReminderType
{
    AppointmentReminder = 0,
    NoShowAlert = 1,
    RefundStatusUpdate = 2,
    WaitlistUpdate = 3,
    StoreClosure = 4
}

public enum PrivacyLevel
{
    Public = 0,
    Internal = 1,
    Confidential = 2,
    Restricted = 3
}

public enum CheckInMethod
{
    Manual = 0,
    QRCode = 1,
    SelfService = 2,
    StaffAssisted = 3
}
