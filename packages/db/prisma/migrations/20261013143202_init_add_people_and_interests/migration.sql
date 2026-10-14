-- CreateTable
CREATE TABLE `Employee` (
    `EmployeeID` INTEGER NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(100) NOT NULL,
    `LastName` VARCHAR(100) NOT NULL,
    `Email` VARCHAR(255) NOT NULL,
    `OfficeLocation` VARCHAR(100) NULL,
    `Department` VARCHAR(100) NULL,
    `Role` VARCHAR(100) NULL,
    `IsActive` BOOLEAN NOT NULL DEFAULT true,
    `CreatedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Employee_Email_key`(`Email`),
    INDEX `IX_Employee_Email`(`Email`),
    PRIMARY KEY (`EmployeeID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Interest` (
    `InterestID` INTEGER NOT NULL AUTO_INCREMENT,
    `InterestName` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `Interest_InterestName_key`(`InterestName`),
    PRIMARY KEY (`InterestID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Match` (
    `MatchID` INTEGER NOT NULL AUTO_INCREMENT,
    `MatchDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `MatchType` VARCHAR(50) NOT NULL,
    `MatchStatus` VARCHAR(50) NOT NULL,
    `GeneratedByWheelSpin` BOOLEAN NOT NULL DEFAULT false,

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
CREATE TABLE `Match_Participant` (
    `MatchParticipantID` INTEGER NOT NULL AUTO_INCREMENT,
    `MatchID` INTEGER NOT NULL,
    `EmployeeID` INTEGER NOT NULL,

    INDEX `IX_MatchParticipant_MatchID`(`MatchID`),
    INDEX `IX_MatchParticipant_EmployeeID`(`EmployeeID`),
    UNIQUE INDEX `UQ_Match_Employee`(`MatchID`, `EmployeeID`),
    PRIMARY KEY (`MatchParticipantID`)
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

    INDEX `IX_Meeting_MatchID`(`MatchID`),
    PRIMARY KEY (`MeetingID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Employee_Interest` ADD CONSTRAINT `Employee_Interest_EmployeeID_fkey` FOREIGN KEY (`EmployeeID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Employee_Interest` ADD CONSTRAINT `Employee_Interest_InterestID_fkey` FOREIGN KEY (`InterestID`) REFERENCES `Interest`(`InterestID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_EmployeeID_fkey` FOREIGN KEY (`EmployeeID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match_Participant` ADD CONSTRAINT `Match_Participant_MatchID_fkey` FOREIGN KEY (`MatchID`) REFERENCES `Match`(`MatchID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Match_Participant` ADD CONSTRAINT `Match_Participant_EmployeeID_fkey` FOREIGN KEY (`EmployeeID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HR_Administrator` ADD CONSTRAINT `HR_Administrator_EmployeeID_fkey` FOREIGN KEY (`EmployeeID`) REFERENCES `Employee`(`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meeting` ADD CONSTRAINT `Meeting_MatchID_fkey` FOREIGN KEY (`MatchID`) REFERENCES `Match`(`MatchID`) ON DELETE CASCADE ON UPDATE CASCADE;
