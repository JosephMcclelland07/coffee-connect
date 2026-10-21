ALTER TABLE `Meeting`
  ADD COLUMN `startsAt` DATETIME(3) NULL,
  ADD COLUMN `endsAt` DATETIME(3) NULL,
  ADD COLUMN `timeZone` VARCHAR(100) NULL,
  ADD COLUMN `organiserId` INTEGER NULL,
  ADD COLUMN `graphEventId` VARCHAR(512) NULL,
  ADD COLUMN `outlookUrl` TEXT NULL,
  ADD COLUMN `bookingKey` VARCHAR(64) NULL,
  ADD COLUMN `activeMatchId` INTEGER NULL,
  ADD COLUMN `syncOperation` VARCHAR(20) NULL,
  ADD COLUMN `syncUpdatedAt` DATETIME(3) NULL,
  ADD UNIQUE INDEX `Meeting_bookingKey_key` (`bookingKey`),
  ADD UNIQUE INDEX `Meeting_activeMatchId_key` (`activeMatchId`),
  ADD CONSTRAINT `Meeting_organiserId_fkey` FOREIGN KEY (`organiserId`) REFERENCES `Employee` (`EmployeeID`) ON DELETE SET NULL ON UPDATE CASCADE;

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
  PRIMARY KEY (`employeeId`),
  UNIQUE INDEX `MicrosoftAccount_tenantId_objectId_key` (`tenantId`, `objectId`),
  CONSTRAINT `MicrosoftAccount_employeeId_fkey` FOREIGN KEY (`employeeId`) REFERENCES `Employee` (`EmployeeID`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ApiSession` (
  `id` VARCHAR(128) NOT NULL,
  `encryptedData` LONGTEXT NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `ApiSession_expiresAt_idx` (`expiresAt`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;