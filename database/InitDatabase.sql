/****** Object:  Database CounselingDB    Script Date: 2024 ******/
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'CounselingDB')
BEGIN
    CREATE DATABASE [CounselingDB]
    COLLATE Chinese_PRC_CI_AS;
END
GO

USE [CounselingDB]
GO

/****** Object:  Table [dbo].[Users]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Users]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Users](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Username] [nvarchar](50) NOT NULL,
    [PasswordHash] [nvarchar](256) NOT NULL,
    [FullName] [nvarchar](100) NOT NULL,
    [Phone] [nvarchar](20) NOT NULL,
    [Email] [nvarchar](100) NULL,
    [Role] [int] NOT NULL DEFAULT 0,
    [PrivacyLevel] [int] NOT NULL DEFAULT 0,
    [IsActive] [bit] NOT NULL DEFAULT 1,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Username] ON [dbo].[Users]([Username] ASC);
CREATE UNIQUE NONCLUSTERED INDEX [IX_Users_Phone] ON [dbo].[Users]([Phone] ASC);
END
GO

/****** Object:  Table [dbo].[Counselors]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Counselors]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Counselors](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [UserId] [int] NOT NULL,
    [Title] [nvarchar](50) NOT NULL,
    [Specialties] [nvarchar](500) NOT NULL,
    [Bio] [nvarchar](max) NULL,
    [MaxDailyAppointments] [int] NOT NULL DEFAULT 8,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_Counselors] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE NONCLUSTERED INDEX [IX_Counselors_UserId] ON [dbo].[Counselors]([UserId] ASC);
END
GO

/****** Object:  Table [dbo].[ServiceItems]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ServiceItems]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[ServiceItems](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [Name] [nvarchar](100) NOT NULL,
    [Description] [nvarchar](500) NOT NULL,
    [Price] [decimal](18, 2) NOT NULL,
    [DurationMinutes] [int] NOT NULL DEFAULT 60,
    [Status] [int] NOT NULL DEFAULT 0,
    [PrivacyLevel] [int] NOT NULL DEFAULT 0,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_ServiceItems] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE UNIQUE NONCLUSTERED INDEX [IX_ServiceItems_Name] ON [dbo].[ServiceItems]([Name] ASC);
END
GO

/****** Object:  Table [dbo].[CounselorServiceItems]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CounselorServiceItems]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CounselorServiceItems](
    [CounselorId] [int] NOT NULL,
    [ServiceItemId] [int] NOT NULL,
 CONSTRAINT [PK_CounselorServiceItems] PRIMARY KEY CLUSTERED ([CounselorId] ASC, [ServiceItemId] ASC)
);
END
GO

/****** Object:  Table [dbo].[Appointments]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Appointments]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Appointments](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [AppointmentNo] [nvarchar](32) NOT NULL,
    [ClientId] [int] NOT NULL,
    [CounselorId] [int] NOT NULL,
    [ServiceItemId] [int] NOT NULL,
    [AppointmentDate] [date] NOT NULL,
    [StartTime] [time](7) NOT NULL,
    [EndTime] [time](7) NOT NULL,
    [Reason] [nvarchar](max) NOT NULL,
    [Status] [int] NOT NULL DEFAULT 0,
    [Notes] [nvarchar](max) NULL,
    [Price] [decimal](18, 2) NOT NULL,
    [IsFromWaitlist] [bit] NOT NULL DEFAULT 0,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_Appointments] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE UNIQUE NONCLUSTERED INDEX [IX_Appointments_AppointmentNo] ON [dbo].[Appointments]([AppointmentNo] ASC);
CREATE NONCLUSTERED INDEX [IX_Appointments_ClientId] ON [dbo].[Appointments]([ClientId] ASC);
CREATE NONCLUSTERED INDEX [IX_Appointments_CounselorId_Date] ON [dbo].[Appointments]([CounselorId] ASC, [AppointmentDate] ASC);
CREATE NONCLUSTERED INDEX [IX_Appointments_Status] ON [dbo].[Appointments]([Status] ASC);
CREATE NONCLUSTERED INDEX [IX_Appointments_Date] ON [dbo].[Appointments]([AppointmentDate] ASC);
END
GO

/****** Object:  Table [dbo].[CheckInRecords]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CheckInRecords]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[CheckInRecords](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [AppointmentId] [int] NOT NULL,
    [CheckInTime] [datetime2](7) NOT NULL,
    [CheckInMethod] [int] NOT NULL DEFAULT 0,
    [CheckedInBy] [nvarchar](50) NULL,
    [IsConfirmed] [bit] NOT NULL DEFAULT 0,
    [ConfirmedAt] [datetime2](7) NULL,
    [ConfirmedBy] [nvarchar](50) NULL,
    [Remarks] [nvarchar](500) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_CheckInRecords] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE UNIQUE NONCLUSTERED INDEX [IX_CheckInRecords_AppointmentId] ON [dbo].[CheckInRecords]([AppointmentId] ASC);
CREATE NONCLUSTERED INDEX [IX_CheckInRecords_CheckInTime] ON [dbo].[CheckInRecords]([CheckInTime] ASC);
END
GO

/****** Object:  Table [dbo].[NoShowRecords]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[NoShowRecords]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[NoShowRecords](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [AppointmentId] [int] NOT NULL,
    [RecordedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [RecordedBy] [nvarchar](50) NULL,
    [Reason] [nvarchar](500) NOT NULL,
    [IsWaived] [bit] NOT NULL DEFAULT 0,
    [WaivedReason] [nvarchar](500) NULL,
    [WaivedBy] [nvarchar](50) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_NoShowRecords] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE UNIQUE NONCLUSTERED INDEX [IX_NoShowRecords_AppointmentId] ON [dbo].[NoShowRecords]([AppointmentId] ASC);
END
GO

/****** Object:  Table [dbo].[RefundRecords]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[RefundRecords]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[RefundRecords](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [AppointmentId] [int] NOT NULL,
    [Amount] [decimal](18, 2) NOT NULL,
    [Status] [int] NOT NULL DEFAULT 0,
    [Reason] [nvarchar](500) NOT NULL,
    [ApprovedAt] [datetime2](7) NULL,
    [ApprovedBy] [nvarchar](50) NULL,
    [RejectedReason] [nvarchar](500) NULL,
    [RejectedAt] [datetime2](7) NULL,
    [RejectedBy] [nvarchar](50) NULL,
    [CompletedAt] [datetime2](7) NULL,
    [TransactionId] [nvarchar](100) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_RefundRecords] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE NONCLUSTERED INDEX [IX_RefundRecords_AppointmentId] ON [dbo].[RefundRecords]([AppointmentId] ASC);
CREATE NONCLUSTERED INDEX [IX_RefundRecords_Status] ON [dbo].[RefundRecords]([Status] ASC);
END
GO

/****** Object:  Table [dbo].[WaitlistItems]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[WaitlistItems]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[WaitlistItems](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [ClientId] [int] NOT NULL,
    [ServiceItemId] [int] NOT NULL,
    [PreferredCounselorId] [int] NULL,
    [PreferredDate] [date] NOT NULL,
    [Reason] [nvarchar](500) NOT NULL,
    [IsActive] [bit] NOT NULL DEFAULT 1,
    [Priority] [int] NOT NULL DEFAULT 0,
    [Notified] [bit] NOT NULL DEFAULT 0,
    [NotifiedAt] [datetime2](7) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_WaitlistItems] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE NONCLUSTERED INDEX [IX_WaitlistItems_ServiceItemId] ON [dbo].[WaitlistItems]([ServiceItemId] ASC, [IsActive] ASC);
CREATE NONCLUSTERED INDEX [IX_WaitlistItems_Date] ON [dbo].[WaitlistItems]([PreferredDate] ASC, [IsActive] ASC);
END
GO

/****** Object:  Table [dbo].[Reminders]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Reminders]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[Reminders](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [AppointmentId] [int] NULL,
    [UserId] [int] NOT NULL,
    [Type] [int] NOT NULL,
    [Title] [nvarchar](100) NOT NULL,
    [Message] [nvarchar](500) NOT NULL,
    [IsRead] [bit] NOT NULL DEFAULT 0,
    [ReadAt] [datetime2](7) NULL,
    [ScheduledAt] [datetime2](7) NOT NULL,
    [IsSent] [bit] NOT NULL DEFAULT 0,
    [SentAt] [datetime2](7) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_Reminders] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE NONCLUSTERED INDEX [IX_Reminders_UserId] ON [dbo].[Reminders]([UserId] ASC, [IsRead] ASC);
CREATE NONCLUSTERED INDEX [IX_Reminders_ScheduledAt] ON [dbo].[Reminders]([ScheduledAt] ASC, [IsSent] ASC);
END
GO

/****** Object:  Table [dbo].[StoreClosures]    ******/
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[StoreClosures]') AND type in (N'U'))
BEGIN
CREATE TABLE [dbo].[StoreClosures](
    [Id] [int] IDENTITY(1,1) NOT NULL,
    [ClosureDate] [date] NOT NULL,
    [StartTime] [time](7) NOT NULL,
    [EndTime] [time](7) NOT NULL,
    [Reason] [nvarchar](500) NOT NULL,
    [IsFullDay] [bit] NOT NULL DEFAULT 0,
    [AffectedCounselors] [nvarchar](500) NULL,
    [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    [UpdatedAt] [datetime2](7) NULL,
    [CreatedBy] [nvarchar](50) NOT NULL DEFAULT 'system',
    [UpdatedBy] [nvarchar](50) NULL,
    [IsDeleted] [bit] NOT NULL DEFAULT 0,
 CONSTRAINT [PK_StoreClosures] PRIMARY KEY CLUSTERED ([Id] ASC)
);
CREATE NONCLUSTERED INDEX [IX_StoreClosures_Date] ON [dbo].[StoreClosures]([ClosureDate] ASC);
END
GO

/****** Insert initial admin user  ******/
IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'admin')
BEGIN
    INSERT INTO Users (Username, PasswordHash, FullName, Phone, Role, PrivacyLevel, CreatedBy)
    VALUES ('admin', 'AQAAAAEAACcQAAAAEBLjouNqaeiVWbN0HbM2Zg6VdL3qU1rqj6V5aYH4jFfZk1a7x9p8G3h2K1J0L9M8N7', '系统管理员', '13800138000', 4, 3, 'system');
END
GO

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'receptionist')
BEGIN
    INSERT INTO Users (Username, PasswordHash, FullName, Phone, Role, PrivacyLevel, CreatedBy)
    VALUES ('receptionist', 'AQAAAAEAACcQAAAAEBLjouNqaeiVWbN0HbM2Zg6VdL3qU1rqj6V5aYH4jFfZk1a7x9p8G3h2K1J0L9M8N7', '前台接待', '13800138001', 2, 1, 'system');
END
GO

IF NOT EXISTS (SELECT * FROM Users WHERE Username = 'client1')
BEGIN
    INSERT INTO Users (Username, PasswordHash, FullName, Phone, Role, PrivacyLevel, CreatedBy)
    VALUES ('client1', 'AQAAAAEAACcQAAAAEBLjouNqaeiVWbN0HbM2Zg6VdL3qU1rqj6V5aYH4jFfZk1a7x9p8G3h2K1J0L9M8N7', '测试用户', '13900139001', 0, 0, 'system');
END
GO

/****** Insert sample service items ******/
IF NOT EXISTS (SELECT * FROM ServiceItems WHERE Name = '个人心理咨询')
BEGIN
    INSERT INTO ServiceItems (Name, Description, Price, DurationMinutes, Status, PrivacyLevel, CreatedBy)
    VALUES ('个人心理咨询', '一对一专业心理咨询服务，帮助您解决情绪、压力、人际关系等问题', 300.00, 60, 0, 0, 'system');
END
GO

IF NOT EXISTS (SELECT * FROM ServiceItems WHERE Name = '婚姻家庭咨询')
BEGIN
    INSERT INTO ServiceItems (Name, Description, Price, DurationMinutes, Status, PrivacyLevel, CreatedBy)
    VALUES ('婚姻家庭咨询', '针对婚姻关系、家庭矛盾、亲子关系等问题的专业咨询', 500.00, 90, 0, 0, 'system');
END
GO

IF NOT EXISTS (SELECT * FROM ServiceItems WHERE Name = '青少年心理辅导')
BEGIN
    INSERT INTO ServiceItems (Name, Description, Price, DurationMinutes, Status, PrivacyLevel, CreatedBy)
    VALUES ('青少年心理辅导', '专注于青少年成长问题，包括学业压力、青春期困惑等', 280.00, 60, 0, 0, 'system');
END
GO
