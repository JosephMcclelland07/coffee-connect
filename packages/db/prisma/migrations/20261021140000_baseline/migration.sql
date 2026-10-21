-- CreateTable
CREATE TABLE `Employee` (
    `EmployeeID` INTEGER NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(100) NOT NULL,
    `LastName` VARCHAR(100) NOT NULL,
    `Email` VARCHAR(255) NOT NULL,
    `PasswordHash` VARCHAR(255) NULL,
    `OfficeLocation` VARCHAR(100) NULL,
    `Department` VARCHAR(100) NULL,
    `Role` VARCHAR(100) NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `LastLoginAt` DATETIME(3) NULL,
    `LastFailedLoginAt` DATETIME(3) NULL,
    `FailedLoginCount` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `Employee_Email_key`(`Email`),
    INDEX `IX_Employee_Email`(`Email`),
    PRIMARY KEY (`EmployeeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interest` (
    `InterestID` INTEGER NOT NULL AUTO_INCREMENT,
    `InterestName` VARCHAR(100) NOT NULL,
    `CategoryID` INTEGER NULL,

    UNIQUE INDEX `Interest_InterestName_key`(`InterestName`),
    INDEX `IX_Interest_CategoryID`(`CategoryID`),
    PRIMARY KEY (`InterestID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interest_Category` (
    `InterestCategoryID` INTEGER NOT NULL AUTO_INCREMENT,
    `CategoryName` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `Interest_Category_CategoryName_key`(`CategoryName`),
    PRIMARY KEY (`InterestCategoryID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `MatchID` INTEGER NOT NULL AUTO_INCREMENT,
    `MatchDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `MatchType` VARCHAR(50) NOT NULL,
    `MatchStatus` VARCHAR(50) NOT NULL,
    `GeneratedByWheelSpin` BOOLEAN NOT NULL DEFAULT false,
    `EmployeeOneID` INTEGER NOT NULL,
    `EmployeeTwoID` INTEGER NOT NULL,

    INDEX `IX_Match_EmployeeOneID`(`EmployeeOneID`),
    INDEX `IX_Match_EmployeeTwoID`(`EmployeeTwoID`),
    PRIMARY KEY (`MatchID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Employee_Interest` (
    `EmployeeInterestID` INTEGER NOT NULL AUTO_INCREMENT,
    `EmployeeID` INTEGER NOT NULL,
    `InterestID` INTEGER NOT NULL,

    INDEX `IX_EmployeeInterest_EmployeeID`(`EmployeeID`),
    INDEX `IX_EmployeeInterest_InterestID`(`InterestID`),
    UNIQUE INDEX `UQ_Employee_Interest`(`EmployeeID`, `InterestID`),
    PRIMARY KEY (`EmployeeInterestID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Notification` (
    `NotificationID` INTEGER NOT NULL AUTO_INCREMENT,
    `EmployeeID` INTEGER NOT NULL,
    `Message` TEXT NOT NULL,
    `SentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `IsRead` BOOLEAN NOT NULL DEFAULT false,

    INDEX `IX_Notification_EmployeeID`(`EmployeeID`),
    PRIMARY KEY (`NotificationID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HR_Administrator` (
    `AdminID` INTEGER NOT NULL AUTO_INCREMENT,
    `EmployeeID` INTEGER NOT NULL,
    `PermissionLevel` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `HR_Administrator_EmployeeID_key`(`EmployeeID`),
    INDEX `IX_HRAdministrator_EmployeeID`(`EmployeeID`),
    PRIMARY KEY (`AdminID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meeting` (
    `MeetingID` INTEGER NOT NULL AUTO_INCREMENT,
    `MatchID` INTEGER NOT NULL,
    `MeetingDate` DATE NOT NULL,
    `StartTime` TIME(0) NOT NULL,
    `EndTime` TIME(0) NOT NULL,
    `Location` VARCHAR(255) NULL,
    `Status` VARCHAR(50) NOT NULL,
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `timeZone` VARCHAR(100) NULL,
    `organiserId` INTEGER NULL,
    `graphEventId` VARCHAR(512) NULL,
    `outlookUrl` TEXT NULL,
    `bookingKey` VARCHAR(64) NULL,
    `activeMatchId` INTEGER NULL,
    `syncOperation` VARCHAR(20) NULL,
    `syncUpdatedAt` DATETIME(3) NULL,

    UNIQUE INDEX `Meeting_bookingKey_key`(`bookingKey`),
    UNIQUE INDEX `Meeting_activeMatchId_key`(`activeMatchId`),
    INDEX `IX_Meeting_MatchID`(`MatchID`),
    PRIMARY KEY (`MeetingID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MicrosoftAccount` (
    `employeeId` INTEGER NOT NULL,
    `tenantId` VARCHAR(100) NOT NULL,
    `objectId` VARCHAR(100) NOT NULL,
    `homeAccountId` VARCHAR(255) NOT NULL,
    `mailbox` VARCHAR(255) NOT NULL,
    `encryptedCache` LONGTEXT NOT NULL,
    `timeZone` VARCHAR(100) NOT NULL DEFAULT 'Europe/London',
    `workStart` INTEGER NOT NULL DEFAULT 540,
    `workEnd` INTEGER NOT NULL DEFAULT 1020,
    `connected` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `MicrosoftAccount_tenantId_objectId_key`(`tenantId`, `objectId`),
    PRIMARY KEY (`employeeId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ApiSession` (
    `id` VARCHAR(128) NOT NULL,
    `encryptedData` LONGTEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    INDEX `ApiSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuthEvent` (
    `AuthEventID` INTEGER NOT NULL AUTO_INCREMENT,
    `EmployeeID` INTEGER NULL,
    `Email` VARCHAR(255) NULL,
    `EventType` VARCHAR(30) NOT NULL,
    `AuthMethod` VARCHAR(30) NOT NULL,
    `CreatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `IX_AuthEvent_EmployeeID`(`EmployeeID`),
    INDEX `IX_AuthEvent_CreatedAt`(`CreatedAt`),
    PRIMARY KEY (`AuthEventID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Interest` ADD CONSTRAINT `Interest_CategoryID_fkey` FOREIGN KEY (`CategoryID`) REFERENCES `Interest_Category`(`InterestCategoryID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_EmployeeOneID_fkey` FOREIGN KEY (`EmployeeOneID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match` ADD CONSTRAINT `Match_EmployeeTwoID_fkey` FOREIGN KEY (`EmployeeTwoID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee_Interest` ADD CONSTRAINT `Employee_Interest_EmployeeID_fkey` FOREIGN KEY (`EmployeeID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee_Interest` ADD CONSTRAINT `Employee_Interest_InterestID_fkey` FOREIGN KEY (`InterestID`) REFERENCES `Interest`(`InterestID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_EmployeeID_fkey` FOREIGN KEY (`EmployeeID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HR_Administrator` ADD CONSTRAINT `HR_Administrator_EmployeeID_fkey` FOREIGN KEY (`EmployeeID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_MatchID_fkey` FOREIGN KEY (`MatchID`) REFERENCES `Match`(`MatchID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_organiserId_fkey` FOREIGN KEY (`organiserId`) REFERENCES `Employee`(`EmployeeID`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MicrosoftAccount` ADD CONSTRAINT `MicrosoftAccount_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuthEvent` ADD CONSTRAINT `AuthEvent_EmployeeID_fkey` FOREIGN KEY (`EmployeeID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE SET NULL ON UPDATE CASCADE;
