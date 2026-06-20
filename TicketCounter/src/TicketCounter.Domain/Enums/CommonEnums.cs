
namespace TicketCounter.Domain.Enums;

public enum SessionStatus
{
    Draft = 0,
    Published = 1,
    Ongoing = 2,
    Ended = 3,
    Cancelled = 4
}

public enum SeatStatus
{
    Available = 0,
    Reserved = 1,
    Sold = 2,
    Locked = 3,
    Maintenance = 4
}

public enum TicketType
{
    Standard = 0,
    VIP = 1,
    VVIP = 2,
    Speaker = 3,
    Media = 4,
    Sponsor = 5
}

public enum RegistrationStatus
{
    Pending = 0,
    Reviewing = 1,
    Approved = 2,
    Rejected = 3,
    Cancelled = 4,
    Completed = 5
}

public enum RegistrationSource
{
    Online = 0,
    Offline = 1,
    Invitation = 2,
    Partner = 3
}

public enum TodoStatus
{
    Pending = 0,
    Processing = 1,
    Completed = 2,
    Cancelled = 3
}

public enum TodoPriority
{
    Low = 0,
    Medium = 1,
    High = 2,
    Urgent = 3
}

public enum ApiRetryStatus
{
    Failed = 0,
    Retrying = 1,
    Success = 2,
    MaxRetriesExceeded = 3
}

public enum AuditAction
{
    Create = 0,
    Update = 1,
    Delete = 2,
    Approve = 3,
    Reject = 4,
    Cancel = 5,
    Export = 6,
    Retry = 7,
    Login = 8
}
