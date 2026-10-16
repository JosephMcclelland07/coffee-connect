CREATE TABLE `Interest_Category` (
    `InterestCategoryID` INTEGER NOT NULL AUTO_INCREMENT,
    `CategoryName` VARCHAR(100) NOT NULL,

    UNIQUE INDEX `Interest_Category_CategoryName_key`(`CategoryName`),
    PRIMARY KEY (`InterestCategoryID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Interest` ADD COLUMN `CategoryID` INTEGER NULL;

CREATE INDEX `IX_Interest_CategoryID` ON `Interest`(`CategoryID`);

ALTER TABLE `Interest` ADD CONSTRAINT `Interest_CategoryID_fkey`
    FOREIGN KEY (`CategoryID`) REFERENCES `Interest_Category`(`InterestCategoryID`)
    ON DELETE SET NULL ON UPDATE CASCADE;