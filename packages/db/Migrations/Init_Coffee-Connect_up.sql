/* ==========================================
   COFFEE CONNECT DATABASE TABLES
   MySQL 8.0 Compatible
   ========================================== */

/* ==========================================
   EMPLOYEE
   ========================================== */
CREATE TABLE IF NOT EXISTS Employee (
    EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
    FirstName VARCHAR(100) NOT NULL,
    LastName VARCHAR(100) NOT NULL,
    Email VARCHAR(255) NOT NULL UNIQUE,
    OfficeLocation VARCHAR(100),
    Department VARCHAR(100),
    Role VARCHAR(100),
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    CreatedDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

/* ==========================================
   INTEREST
   ========================================== */
CREATE TABLE IF NOT EXISTS Interest (
    InterestID INT AUTO_INCREMENT PRIMARY KEY,
    InterestName VARCHAR(100) NOT NULL UNIQUE
);

/* ==========================================
   MATCH
   ========================================== */
CREATE TABLE IF NOT EXISTS `Match` (
    MatchID INT AUTO_INCREMENT PRIMARY KEY,
    MatchDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    MatchType VARCHAR(50) NOT NULL,
    MatchStatus VARCHAR(50) NOT NULL,
    GeneratedByWheelSpin BOOLEAN NOT NULL DEFAULT FALSE,
    EmployeeOneID INT NOT NULL,
    EmployeeTwoID INT NOT NULL,

    CONSTRAINT FK_Match_EmployeeOne
        FOREIGN KEY (EmployeeOneID)
        REFERENCES Employee(EmployeeID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT FK_Match_EmployeeTwo
        FOREIGN KEY (EmployeeTwoID)
        REFERENCES Employee(EmployeeID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

/* ==========================================
   EMPLOYEE_INTEREST
   Junction Table
   ========================================== */
CREATE TABLE IF NOT EXISTS Employee_Interest (
    EmployeeInterestID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID INT NOT NULL,
    InterestID INT NOT NULL,

    CONSTRAINT FK_EmployeeInterest_Employee
        FOREIGN KEY (EmployeeID)
        REFERENCES Employee(EmployeeID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT FK_EmployeeInterest_Interest
        FOREIGN KEY (InterestID)
        REFERENCES Interest(InterestID)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT UQ_Employee_Interest
        UNIQUE (EmployeeID, InterestID)
);

/* ==========================================
   NOTIFICATION
   ========================================== */
CREATE TABLE IF NOT EXISTS Notification (
    NotificationID INT AUTO_INCREMENT PRIMARY KEY,
    EmployeeID INT NOT NULL,
    Message TEXT NOT NULL,
    SentDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IsRead BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT FK_Notification_Employee
        FOREIGN KEY (EmployeeID)
        REFERENCES Employee(EmployeeID)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


/* ==========================================
   INDEXES
   ========================================== */

CREATE INDEX IX_Employee_Email
    ON Employee (Email);

CREATE INDEX IX_Notification_EmployeeID
    ON Notification (EmployeeID);

CREATE INDEX IX_Match_EmployeeOneID
    ON `Match` (EmployeeOneID);

CREATE INDEX IX_Match_EmployeeTwoID
    ON `Match` (EmployeeTwoID);


CREATE INDEX IX_EmployeeInterest_EmployeeID
    ON Employee_Interest (EmployeeID);

CREATE INDEX IX_EmployeeInterest_InterestID
    ON Employee_Interest (InterestID);

