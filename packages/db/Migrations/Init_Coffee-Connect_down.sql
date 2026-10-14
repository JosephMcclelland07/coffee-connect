/* ==========================================
   REMOVE COFFEE CONNECT TABLES
   Drop child tables first, then parent tables
   ========================================== */
DROP INDEX IX_HRAdministrator_EmployeeID ON HR_Administrator;
DROP INDEX IX_EmployeeInterest_InterestID ON Employee_Interest;
DROP INDEX IX_EmployeeInterest_EmployeeID ON Employee_Interest;
DROP INDEX IX_Meeting_MatchID ON Meeting;
DROP INDEX IX_Match_EmployeeTwoID ON `Match`;
DROP INDEX IX_Match_EmployeeOneID ON `Match`;
DROP INDEX IX_Notification_EmployeeID ON Notification;
DROP INDEX IX_Employee_Email ON Employee;

/* Child Tables */
DROP TABLE IF EXISTS Meeting;
DROP TABLE IF EXISTS HR_Administrator;
DROP TABLE IF EXISTS Notification;
DROP TABLE IF EXISTS Employee_Interest;

/* Parent Tables */
DROP TABLE IF EXISTS `Match`;
DROP TABLE IF EXISTS Interest;
DROP TABLE IF EXISTS Employee;

