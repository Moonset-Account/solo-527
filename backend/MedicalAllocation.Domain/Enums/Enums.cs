namespace MedicalAllocation.Domain.Enums;

public enum UserRole
{
    Planner = 1,
    Admin = 2
}

public enum AllocationStatus
{
    Pending = 1,
    Approved = 2,
    Rejected = 3,
    InTransit = 4,
    Completed = 5,
    Cancelled = 6
}

public enum SupplierReplyStatus
{
    Pending = 1,
    Replied = 2,
    Confirmed = 3,
    Delayed = 4
}

public enum ReceiptStatus
{
    Pending = 1,
    Partial = 2,
    Completed = 3,
    Discrepancy = 4
}

public enum DiscrepancyType
{
    QuantityShort = 1,
    QuantityOver = 2,
    Damaged = 3,
    Expired = 4,
    WrongBatch = 5,
    WrongProduct = 6
}

public enum DiscrepancyStatus
{
    Open = 1,
    Investigating = 2,
    Resolved = 3,
    Escalated = 4
}

public enum ExceptionType
{
    DeliveryDelay = 1,
    QualityIssue = 2,
    StockoutRisk = 3,
    SupplierIssue = 4
}

public enum RiskLevel
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum ReplenishmentPriority
{
    Normal = 1,
    Urgent = 2,
    Emergency = 3
}
