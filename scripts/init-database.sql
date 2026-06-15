-- 印刷厂订单门店协同台面系统 - 数据库初始化脚本
-- 执行前请确保已安装 SQL Server 2019+

-- 1. 创建数据库
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'PrintingFactoryDb')
BEGIN
    CREATE DATABASE PrintingFactoryDb;
    PRINT '✅ 数据库 PrintingFactoryDb 创建成功';
END
ELSE
BEGIN
    PRINT 'ℹ️  数据库 PrintingFactoryDb 已存在';
END
GO

USE PrintingFactoryDb;
GO

-- 2. 门店种子数据
IF NOT EXISTS (SELECT 1 FROM Stores WHERE Id = 1)
BEGIN
    SET IDENTITY_INSERT Stores ON;
    
    INSERT INTO Stores (Id, Name, ContactPerson, Phone, Address, IsActive, CreatedAt)
    VALUES 
    (1, N'中心门店', N'张三', N'13800138001', N'北京市朝阳区中心路1号', 1, GETDATE()),
    (2, N'东区门店', N'李四', N'13800138002', N'北京市东区东大街2号', 1, GETDATE()),
    (3, N'西区门店', N'王五', N'13800138003', N'北京市西区西大街3号', 1, GETDATE()),
    (4, N'南区门店', N'赵六', N'13800138004', N'北京市南区南大街4号', 1, GETDATE()),
    (5, N'北区门店', N'钱七', N'13800138005', N'北京市北区北大街5号', 1, GETDATE());
    
    SET IDENTITY_INSERT Stores OFF;
    PRINT '✅ 门店种子数据插入成功 (5条)';
END
ELSE
BEGIN
    PRINT 'ℹ️  门店种子数据已存在';
END
GO

-- 3. 生产节点种子数据
IF NOT EXISTS (SELECT 1 FROM ProductionNodes WHERE Id = 1)
BEGIN
    SET IDENTITY_INSERT ProductionNodes ON;
    
    INSERT INTO ProductionNodes (Id, Name, Code, SortOrder, EstimatedDurationMinutes, Description, IsActive, CreatedAt)
    VALUES 
    (1, N'接单审核', N'ORDER_REVIEW', 1, 30, N'审核订单信息，确认客户需求', 1, GETDATE()),
    (2, N'设计排版', N'DESIGN', 2, 120, N'根据客户需求进行设计和排版', 1, GETDATE()),
    (3, N'客户确认', N'CUSTOMER_CONFIRM', 3, 60, N'将设计稿发给客户确认', 1, GETDATE()),
    (4, N'制版', N'PLATE_MAKING', 4, 90, N'制作印刷版', 1, GETDATE()),
    (5, N'印刷', N'PRINTING', 5, 180, N'上机印刷', 1, GETDATE()),
    (6, N'后加工', N'FINISHING', 6, 120, N'裁切、装订、覆膜等后加工', 1, GETDATE()),
    (7, N'质检入库', N'QUALITY_CHECK', 7, 60, N'质量检验，合格后入库', 1, GETDATE());
    
    SET IDENTITY_INSERT ProductionNodes OFF;
    PRINT '✅ 生产节点种子数据插入成功 (7条)';
END
ELSE
BEGIN
    PRINT 'ℹ️  生产节点种子数据已存在';
END
GO

-- 4. 设备种子数据
IF NOT EXISTS (SELECT 1 FROM Equipment WHERE Id = 1)
BEGIN
    SET IDENTITY_INSERT Equipment ON;
    
    INSERT INTO Equipment (Id, Name, Code, Type, Status, Location, LastMaintenanceDate, NextMaintenanceDate, Remarks, IsActive, CreatedAt)
    VALUES 
    (1, N'海德堡印刷机1号', N'HD-001', N'印刷机', N'Idle', N'印刷车间A区', DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 1, GETDATE()), N'主力印刷设备', 1, GETDATE()),
    (2, N'海德堡印刷机2号', N'HD-002', N'印刷机', N'InUse', N'印刷车间A区', DATEADD(MONTH, -2, GETDATE()), DATEADD(DAY, 15, GETDATE()), N'主力印刷设备', 1, GETDATE()),
    (3, N'小森印刷机', N'KS-001', N'印刷机', N'Maintenance', N'印刷车间B区', DATEADD(MONTH, -3, GETDATE()), GETDATE(), N'定期维护中', 1, GETDATE()),
    (4, N'切纸机1号', N'QC-001', N'切纸机', N'Idle', N'后加工车间', DATEADD(MONTH, -1, GETDATE()), DATEADD(MONTH, 2, GETDATE()), N'', 1, GETDATE()),
    (5, N'切纸机2号', N'QC-002', N'切纸机', N'Idle', N'后加工车间', DATEADD(MONTH, -6, GETDATE()), DATEADD(MONTH, 1, GETDATE()), N'', 1, GETDATE()),
    (6, N'胶装机', N'JZ-001', N'装订设备', N'Idle', N'后加工车间', DATEADD(MONTH, -2, GETDATE()), DATEADD(MONTH, 3, GETDATE()), N'', 1, GETDATE()),
    (7, N'覆膜机', N'FM-001', N'表面处理', N'Faulty', N'后加工车间', DATEADD(MONTH, -3, GETDATE()), DATEADD(MONTH, 1, GETDATE()), N'待维修', 1, GETDATE()),
    (8, N'CTP制版机', N'CTP-001', N'制版设备', N'Idle', N'制版车间', DATEADD(DAY, -15, GETDATE()), DATEADD(MONTH, 3, GETDATE()), N'', 1, GETDATE());
    
    SET IDENTITY_INSERT Equipment OFF;
    PRINT '✅ 设备种子数据插入成功 (8条)';
END
ELSE
BEGIN
    PRINT 'ℹ️  设备种子数据已存在';
END
GO

-- 5. 创建索引优化查询性能
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_StoreId')
BEGIN
    CREATE INDEX IX_Orders_StoreId ON Orders (StoreId);
    PRINT '✅ 索引 IX_Orders_StoreId 创建成功';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_Status')
BEGIN
    CREATE INDEX IX_Orders_Status ON Orders (Status);
    PRINT '✅ 索引 IX_Orders_Status 创建成功';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Orders_DeliveryDate')
BEGIN
    CREATE INDEX IX_Orders_DeliveryDate ON Orders (DeliveryDate);
    PRINT '✅ 索引 IX_Orders_DeliveryDate 创建成功';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProductionProgress_OrderId')
BEGIN
    CREATE INDEX IX_ProductionProgress_OrderId ON ProductionProgress (OrderId);
    PRINT '✅ 索引 IX_ProductionProgress_OrderId 创建成功';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_EquipmentAssignments_EquipmentId')
BEGIN
    CREATE INDEX IX_EquipmentAssignments_EquipmentId ON EquipmentAssignments (EquipmentId);
    PRINT '✅ 索引 IX_EquipmentAssignments_EquipmentId 创建成功';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_QualityInspections_OrderId')
BEGIN
    CREATE INDEX IX_QualityInspections_OrderId ON QualityInspections (OrderId);
    PRINT '✅ 索引 IX_QualityInspections_OrderId 创建成功';
END

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_BatchOperations_CreatedAt')
BEGIN
    CREATE INDEX IX_BatchOperations_CreatedAt ON BatchOperations (CreatedAt DESC);
    PRINT '✅ 索引 IX_BatchOperations_CreatedAt 创建成功';
END
GO

PRINT '';
PRINT '==========================================';
PRINT '  数据库初始化完成';
PRINT '==========================================';
PRINT '✅ 数据库: PrintingFactoryDb';
PRINT '✅ 门店数据: 5条';
PRINT '✅ 生产节点: 7条';
PRINT '✅ 设备数据: 8条';
PRINT '✅ 查询索引: 已创建';
PRINT '';
PRINT '请在 appsettings.json 中配置正确的连接字符串';
PRINT '==========================================';
