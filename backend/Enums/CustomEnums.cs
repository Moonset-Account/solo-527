namespace OpsWorkOrder.Enums;

public enum UserRole
{
    StoreOperator = 1,
    Admin = 2
}

public enum AlertStatus
{
    Pending = 1,
    Assigned = 2,
    Processing = 3,
    Resolved = 4,
    Closed = 5,
    Rollback = 6
}

public enum AlertPriority
{
    Low = 1,
    Medium = 2,
    High = 3,
    Critical = 4
}

public enum AlertType
{
    ServerDown = 1,
    HighCpu = 2,
    HighMemory = 3,
    DiskFull = 4,
    NetworkIssue = 5,
    SecurityVulnerability = 6,
    ApplicationError = 7,
    DatabaseIssue = 8
}

public enum AssetType
{
    Server = 1,
    NetworkDevice = 2,
    Database = 3,
    Application = 4,
    Storage = 5
}

public enum AssetStatus
{
    Active = 1,
    Maintenance = 2,
    Offline = 3,
    Decommissioned = 4
}

public enum BatchTaskStatus
{
    Pending = 1,
    Running = 2,
    Completed = 3,
    PartiallyFailed = 4,
    Failed = 5,
    Cancelled = 6
}

public enum BatchTaskType
{
    BulkAssignAlert = 1,
    BulkCloseAlert = 2,
    BulkAssetSync = 3,
    BulkVulnerabilityScan = 4
}

public enum NotificationType
{
    AlertCreated = 1,
    AlertAssigned = 2,
    AlertStatusChanged = 3,
    AlertOverdue = 4,
    AssetSyncRequired = 5,
    VulnerabilityExpired = 6,
    BatchTaskCompleted = 7
}

public enum AuditActionType
{
    Create = 1,
    Update = 2,
    Delete = 3,
    Assign = 4,
    StatusChange = 5,
    Close = 6,
    Rollback = 7,
    VulnerabilityExtend = 8,
    AssetSync = 9,
    Login = 10,
    Logout = 11
}
