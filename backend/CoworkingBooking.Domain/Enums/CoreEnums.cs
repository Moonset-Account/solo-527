namespace CoworkingBooking.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 1,
    Finance = 2,
    ConsultantManager = 3,
    Consultant = 4,
    LandlordManager = 5,
    Customer = 6
}

public enum SpaceStatus
{
    Available = 1,
    Reserved = 2,
    Rented = 3,
    Maintenance = 4,
    Offline = 5
}

public enum SpaceType
{
    PrivateOffice = 1,
    HotDesk = 2,
    DedicatedDesk = 3,
    MeetingRoom = 4,
    EventSpace = 5
}

public enum AppointmentStatus
{
    Pending = 1,
    Confirmed = 2,
    Completed = 3,
    Cancelled = 4,
    NoShow = 5
}

public enum ContractStatus
{
    Draft = 1,
    PendingSignature = 2,
    Active = 3,
    Expired = 4,
    Terminated = 5
}

public enum OrderStatus
{
    Pending = 1,
    Paid = 2,
    Fulfilling = 3,
    Completed = 4,
    Refunded = 5,
    Cancelled = 6
}

public enum BillStatus
{
    Unpaid = 1,
    PartialPaid = 2,
    Paid = 3,
    Overdue = 4,
    Void = 5
}

public enum NoShowHandleResult
{
    Pending = 1,
    Blacklisted = 2,
    Warning = 3,
    NoPenalty = 4,
    DepositDeducted = 5
}

public enum FulfillmentStatus
{
    Pending = 1,
    InProgress = 2,
    Delivered = 3,
    Received = 4,
    Exception = 5
}

public enum PaymentMethod
{
    Alipay = 1,
    WeChatPay = 2,
    BankTransfer = 3,
    Cash = 4
}
