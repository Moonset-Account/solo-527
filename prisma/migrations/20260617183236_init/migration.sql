-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('LEGAL_MANAGER', 'LAWYER', 'REVIEWER', 'ADMIN') NOT NULL,
    `department` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contracts` (
    `id` VARCHAR(191) NOT NULL,
    `contractNo` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `partyA` VARCHAR(191) NOT NULL,
    `partyB` VARCHAR(191) NOT NULL,
    `contractType` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(18, 2) NULL,
    `currency` VARCHAR(191) NULL DEFAULT 'CNY',
    `signDate` DATETIME(3) NULL,
    `effectiveDate` DATETIME(3) NULL,
    `expiryDate` DATETIME(3) NULL,
    `rectifyDeadline` DATETIME(3) NULL,
    `description` VARCHAR(191) NULL,
    `keywords` VARCHAR(191) NULL,
    `priority` VARCHAR(191) NOT NULL DEFAULT 'NORMAL',
    `status` ENUM('NEW', 'ASSIGNED_LAWYER', 'LAWYER_REVIEWING', 'LAWYER_COMPLETED', 'ASSIGNED_REVIEWER', 'REVIEWER_REVIEWING', 'REVIEWER_COMPLETED', 'PENDING_RECTIFICATION', 'RECTIFYING', 'COMPLETED', 'ERROR') NOT NULL DEFAULT 'NEW',
    `currentVersionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `creatorId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `contracts_contractNo_key`(`contractNo`),
    INDEX `contracts_status_idx`(`status`),
    INDEX `contracts_contractType_idx`(`contractType`),
    INDEX `contracts_rectifyDeadline_idx`(`rectifyDeadline`),
    INDEX `contracts_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contract_versions` (
    `id` VARCHAR(191) NOT NULL,
    `versionNo` INTEGER NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `fileSize` INTEGER NOT NULL,
    `fileHash` VARCHAR(191) NULL,
    `mimeType` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `isCurrent` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `contractId` VARCHAR(191) NOT NULL,
    `uploaderId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `contract_versions_contractId_versionNo_key`(`contractId`, `versionNo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `id` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NOT NULL,
    `lawyerId` VARCHAR(191) NOT NULL,
    `lawyerAssignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lawyerDeadline` DATETIME(3) NULL,
    `lawyerCompletedAt` DATETIME(3) NULL,
    `reviewerId` VARCHAR(191) NULL,
    `reviewerAssignedAt` DATETIME(3) NULL,
    `reviewerDeadline` DATETIME(3) NULL,
    `reviewerCompletedAt` DATETIME(3) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `assignments_lawyerId_idx`(`lawyerId`),
    INDEX `assignments_reviewerId_idx`(`reviewerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `review_opinions` (
    `id` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `opinionType` ENUM('LAW_REVIEW', 'FINAL_REVIEW', 'RECTIFICATION', 'COMMENT') NOT NULL,
    `title` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `clauseRef` VARCHAR(191) NULL,
    `severity` VARCHAR(191) NULL,
    `suggestion` TEXT NULL,
    `hasGap` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `review_opinions_opinionType_idx`(`opinionType`),
    INDEX `review_opinions_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operation_logs` (
    `id` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` ENUM('CREATE_CONTRACT', 'UPLOAD_VERSION', 'ASSIGN_LAWYER', 'ASSIGN_REVIEWER', 'SUBMIT_OPINION', 'CHANGE_STATUS', 'DOWNLOAD', 'RECTIFY', 'COMPLETE', 'ERROR', 'REMIND_SENT') NOT NULL,
    `description` TEXT NULL,
    `fromStatus` VARCHAR(191) NULL,
    `toStatus` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `operation_logs_action_idx`(`action`),
    INDEX `operation_logs_userId_idx`(`userId`),
    INDEX `operation_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `download_records` (
    `id` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `downloadReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ipAddress` VARCHAR(191) NULL,

    INDEX `download_records_contractId_idx`(`contractId`),
    INDEX `download_records_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reminders` (
    `id` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `reminderType` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `deadlineDate` DATETIME(3) NOT NULL,
    `daysBefore` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'ACKNOWLEDGED', 'DISMISSED') NOT NULL DEFAULT 'PENDING',
    `sentAt` DATETIME(3) NULL,
    `acknowledgedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reminders_status_idx`(`status`),
    INDEX `reminders_deadlineDate_idx`(`deadlineDate`),
    UNIQUE INDEX `reminders_contractId_userId_reminderType_key`(`contractId`, `userId`, `reminderType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compliance_gaps` (
    `id` VARCHAR(191) NOT NULL,
    `contractId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `severity` ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW') NOT NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    `clauseRef` VARCHAR(191) NULL,
    `regulation` VARCHAR(191) NULL,
    `reporterId` VARCHAR(191) NOT NULL,
    `resolverId` VARCHAR(191) NULL,
    `resolution` TEXT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `compliance_gaps_severity_idx`(`severity`),
    INDEX `compliance_gaps_status_idx`(`status`),
    INDEX `compliance_gaps_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `contracts` ADD CONSTRAINT `contracts_creatorId_fkey` FOREIGN KEY (`creatorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_versions` ADD CONSTRAINT `contract_versions_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contract_versions` ADD CONSTRAINT `contract_versions_uploaderId_fkey` FOREIGN KEY (`uploaderId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_lawyerId_fkey` FOREIGN KEY (`lawyerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_reviewerId_fkey` FOREIGN KEY (`reviewerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_opinions` ADD CONSTRAINT `review_opinions_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_opinions` ADD CONSTRAINT `review_opinions_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `contract_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `review_opinions` ADD CONSTRAINT `review_opinions_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_logs` ADD CONSTRAINT `operation_logs_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `operation_logs` ADD CONSTRAINT `operation_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `download_records` ADD CONSTRAINT `download_records_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `download_records` ADD CONSTRAINT `download_records_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `contract_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `download_records` ADD CONSTRAINT `download_records_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reminders` ADD CONSTRAINT `reminders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compliance_gaps` ADD CONSTRAINT `compliance_gaps_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `contracts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compliance_gaps` ADD CONSTRAINT `compliance_gaps_reporterId_fkey` FOREIGN KEY (`reporterId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compliance_gaps` ADD CONSTRAINT `compliance_gaps_resolverId_fkey` FOREIGN KEY (`resolverId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
