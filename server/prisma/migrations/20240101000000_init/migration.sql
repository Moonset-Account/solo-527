-- CreateEnum
CREATE TABLE IF NOT EXISTS `Role` (
  `value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `Role` (`value`) VALUES ('GRID_WORKER'), ('ADMIN');

-- CreateEnum
CREATE TABLE IF NOT EXISTS `EventType` (
  `value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `EventType` (`value`) VALUES ('FACILITY_DAMAGE'), ('ENVIRONMENT'), ('SECURITY'), ('PUBLIC_SERVICE'), ('OTHER');

-- CreateEnum
CREATE TABLE IF NOT EXISTS `EventLevel` (
  `value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `EventLevel` (`value`) VALUES ('LOW'), ('MEDIUM'), ('HIGH'), ('URGENT');

-- CreateEnum
CREATE TABLE IF NOT EXISTS `EventStatus` (
  `value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `EventStatus` (`value`) VALUES ('PENDING'), ('ASSIGNED'), ('PROCESSING'), ('COMPLETED'), ('CLOSED'), ('CANCELLED');

-- CreateEnum
CREATE TABLE IF NOT EXISTS `NotificationType` (
  `value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `NotificationType` (`value`) VALUES ('SYSTEM'), ('EVENT'), ('REMINDER');

-- CreateEnum
CREATE TABLE IF NOT EXISTS `OperationStatus` (
  `value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `OperationStatus` (`value`) VALUES ('SUCCESS'), ('FAILED');

-- CreateEnum
CREATE TABLE IF NOT EXISTS `FacilityStatus` (
  `value` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`value`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT IGNORE INTO `FacilityStatus` (`value`) VALUES ('NORMAL'), ('DAMAGED'), ('MAINTENANCE');

-- CreateTable
CREATE TABLE IF NOT EXISTS `Grid` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `area` VARCHAR(191) NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Grid_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `User` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(191) NOT NULL,
  `password` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `role` ENUM('GRID_WORKER', 'ADMIN') NOT NULL DEFAULT 'GRID_WORKER',
  `gridId` INTEGER NULL,
  `avatar` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `User_username_key`(`username`),
  INDEX `User_gridId_idx`(`gridId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Department` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NULL,
  `contact` VARCHAR(191) NULL,
  `phone` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Department_code_key`(`code`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Event` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(191) NOT NULL,
  `description` VARCHAR(191) NULL,
  `type` ENUM('FACILITY_DAMAGE', 'ENVIRONMENT', 'SECURITY', 'PUBLIC_SERVICE', 'OTHER') NOT NULL,
  `level` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL,
  `status` ENUM('PENDING', 'ASSIGNED', 'PROCESSING', 'COMPLETED', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
  `location` VARCHAR(191) NOT NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `gridId` INTEGER NOT NULL,
  `reporterId` INTEGER NOT NULL,
  `assigneeId` INTEGER NULL,
  `departmentId` INTEGER NULL,
  `images` JSON NULL,
  `isEffective` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  `completedAt` DATETIME(3) NULL,

  INDEX `Event_gridId_idx`(`gridId`),
  INDEX `Event_reporterId_idx`(`reporterId`),
  INDEX `Event_assigneeId_idx`(`assigneeId`),
  INDEX `Event_departmentId_idx`(`departmentId`),
  INDEX `Event_status_idx`(`status`),
  INDEX `Event_type_idx`(`type`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `VolunteerService` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `eventId` INTEGER NOT NULL,
  `volunteerName` VARCHAR(191) NOT NULL,
  `volunteerPhone` VARCHAR(191) NOT NULL,
  `serviceHours` DOUBLE NOT NULL,
  `serviceDate` DATETIME(3) NOT NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `VolunteerService_eventId_idx`(`eventId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `OperationLog` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `eventId` INTEGER NULL,
  `action` VARCHAR(191) NOT NULL,
  `operatorId` INTEGER NOT NULL,
  `operatorName` VARCHAR(191) NOT NULL,
  `details` JSON NULL,
  `status` ENUM('SUCCESS', 'FAILED') NOT NULL DEFAULT 'SUCCESS',
  `failureReason` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `OperationLog_eventId_idx`(`eventId`),
  INDEX `OperationLog_operatorId_idx`(`operatorId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Notification` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `userId` INTEGER NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `content` VARCHAR(191) NOT NULL,
  `type` ENUM('SYSTEM', 'EVENT', 'REMINDER') NOT NULL DEFAULT 'SYSTEM',
  `isRead` BOOLEAN NOT NULL DEFAULT false,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `eventId` INTEGER NULL,

  INDEX `Notification_userId_idx`(`userId`),
  INDEX `Notification_eventId_idx`(`eventId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `Facility` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(191) NOT NULL,
  `code` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `location` VARCHAR(191) NOT NULL,
  `latitude` DOUBLE NULL,
  `longitude` DOUBLE NULL,
  `gridId` INTEGER NOT NULL,
  `status` ENUM('NORMAL', 'DAMAGED', 'MAINTENANCE') NOT NULL DEFAULT 'NORMAL',
  `image` VARCHAR(191) NULL,
  `description` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `Facility_code_key`(`code`),
  INDEX `Facility_gridId_idx`(`gridId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_gridId_fkey` FOREIGN KEY (`gridId`) REFERENCES `Grid`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_gridId_fkey` FOREIGN KEY (`gridId`) REFERENCES `Grid`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_assigneeId_fkey` FOREIGN KEY (`assigneeId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Event` ADD CONSTRAINT `Event_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VolunteerService` ADD CONSTRAINT `VolunteerService_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationLog` ADD CONSTRAINT `OperationLog_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OperationLog` ADD CONSTRAINT `OperationLog_operatorId_fkey` FOREIGN KEY (`operatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Facility` ADD CONSTRAINT `Facility_gridId_fkey` FOREIGN KEY (`gridId`) REFERENCES `Grid`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
