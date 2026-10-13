/* ==========================================
   COFFEE CONNECT EMPLOYEE SEED DATA
   MySQL 8.0 Compatible
   ========================================== */

INSERT INTO Employee (
    FirstName,
    LastName,
    Email,
    OfficeLocation,
    Department,
    Role,
    IsActive,
    CreatedDate
)
VALUES
    ('Ava', 'Mitchell', 'ava.mitchell@example.com', 'London', 'Engineering', 'Software Engineer', TRUE, CURRENT_TIMESTAMP),
    ('Noah', 'Patel', 'noah.patel@example.com', 'Manchester', 'People', 'HR Business Partner', TRUE, CURRENT_TIMESTAMP),
    ('Mia', 'Thompson', 'mia.thompson@example.com', 'Bristol', 'Finance', 'Financial Analyst', TRUE, CURRENT_TIMESTAMP),
    ('Liam', 'Roberts', 'liam.roberts@example.com', 'London', 'Product', 'Product Manager', TRUE, CURRENT_TIMESTAMP),
    ('Isla', 'Campbell', 'isla.campbell@example.com', 'Edinburgh', 'Design', 'UX Designer', TRUE, CURRENT_TIMESTAMP),
    ('Oliver', 'Nguyen', 'oliver.nguyen@example.com', 'Manchester', 'Engineering', 'Data Engineer', TRUE, CURRENT_TIMESTAMP),
    ('Amelia', 'Walker', 'amelia.walker@example.com', 'Bristol', 'Marketing', 'Marketing Manager', TRUE, CURRENT_TIMESTAMP),
    ('Jack', 'Evans', 'jack.evans@example.com', 'London', 'Sales', 'Account Executive', TRUE, CURRENT_TIMESTAMP),
    ('Freya', 'Morgan', 'freya.morgan@example.com', 'Cardiff', 'People', 'Talent Specialist', TRUE, CURRENT_TIMESTAMP),
    ('Leo', 'Hughes', 'leo.hughes@example.com', 'Edinburgh', 'Engineering', 'Frontend Developer', TRUE, CURRENT_TIMESTAMP),
    ('Grace', 'Bennett', 'grace.bennett@example.com', 'London', 'Operations', 'Operations Analyst', TRUE, CURRENT_TIMESTAMP),
    ('Theo', 'Reed', 'theo.reed@example.com', 'Manchester', 'Product', 'Product Designer', TRUE, CURRENT_TIMESTAMP),
    ('Lily', 'Foster', 'lily.foster@example.com', 'Bristol', 'Customer Success', 'Customer Success Manager', TRUE, CURRENT_TIMESTAMP),
    ('Oscar', 'Murphy', 'oscar.murphy@example.com', 'Cardiff', 'Finance', 'Management Accountant', TRUE, CURRENT_TIMESTAMP),
    ('Poppy', 'Bailey', 'poppy.bailey@example.com', 'London', 'Engineering', 'Backend Developer', TRUE, CURRENT_TIMESTAMP);

INSERT INTO HR_Administrator (EmployeeID, PermissionLevel)
SELECT e.EmployeeID, admins.PermissionLevel
FROM (
    SELECT 'Noah' AS FirstName, 'Patel' AS LastName, 'Full Access' AS PermissionLevel
    UNION ALL SELECT 'Freya', 'Morgan', 'Full Access'
) AS admins
JOIN Employee e
    ON e.FirstName = admins.FirstName
    AND e.LastName = admins.LastName;

INSERT INTO Interest (InterestName)
VALUES
    ('Hiking'),
    ('Cooking'),
    ('Reading'),
    ('Photography'),
    ('Cycling'),
    ('Running'),
    ('Board Games'),
    ('Gardening'),
    ('Travel'),
    ('Live Music'),
    ('Yoga'),
    ('Coffee'),
    ('Technology'),
    ('Art'),
    ('Volunteering');


INSERT INTO `Match` (
    MatchDate,
    MatchType,
    MatchStatus,
    GeneratedByWheelSpin,
    EmployeeOneID,
    EmployeeTwoID
)
SELECT
    CURRENT_TIMESTAMP - INTERVAL (19 - match_seed.MatchOffset) DAY,
    'Interest-Based',
    'Completed',
    FALSE,
    employee_one.EmployeeID,
    employee_two.EmployeeID
FROM (
    SELECT 0 AS MatchOffset, 'ava.mitchell@example.com' AS EmployeeOneEmail, 'noah.patel@example.com' AS EmployeeTwoEmail
    UNION ALL SELECT 1, 'mia.thompson@example.com', 'liam.roberts@example.com'
    UNION ALL SELECT 2, 'isla.campbell@example.com', 'oliver.nguyen@example.com'
    UNION ALL SELECT 3, 'amelia.walker@example.com', 'jack.evans@example.com'
    UNION ALL SELECT 4, 'freya.morgan@example.com', 'leo.hughes@example.com'
    UNION ALL SELECT 5, 'grace.bennett@example.com', 'theo.reed@example.com'
    UNION ALL SELECT 6, 'lily.foster@example.com', 'oscar.murphy@example.com'
    UNION ALL SELECT 7, 'poppy.bailey@example.com', 'ava.mitchell@example.com'
    UNION ALL SELECT 8, 'noah.patel@example.com', 'mia.thompson@example.com'
    UNION ALL SELECT 9, 'liam.roberts@example.com', 'isla.campbell@example.com'
    UNION ALL SELECT 10, 'oliver.nguyen@example.com', 'amelia.walker@example.com'
    UNION ALL SELECT 11, 'jack.evans@example.com', 'freya.morgan@example.com'
    UNION ALL SELECT 12, 'leo.hughes@example.com', 'grace.bennett@example.com'
    UNION ALL SELECT 13, 'theo.reed@example.com', 'lily.foster@example.com'
    UNION ALL SELECT 14, 'oscar.murphy@example.com', 'poppy.bailey@example.com'
    UNION ALL SELECT 15, 'ava.mitchell@example.com', 'mia.thompson@example.com'
    UNION ALL SELECT 16, 'noah.patel@example.com', 'isla.campbell@example.com'
    UNION ALL SELECT 17, 'liam.roberts@example.com', 'oliver.nguyen@example.com'
    UNION ALL SELECT 18, 'amelia.walker@example.com', 'freya.morgan@example.com'
    UNION ALL SELECT 19, 'jack.evans@example.com', 'leo.hughes@example.com'
) AS match_seed
JOIN Employee employee_one ON employee_one.Email = match_seed.EmployeeOneEmail
JOIN Employee employee_two ON employee_two.Email = match_seed.EmployeeTwoEmail
ORDER BY match_seed.MatchOffset;

SET @seed_match_first_id = LAST_INSERT_ID();

INSERT INTO Meeting (MatchID, MeetingDate, StartTime, EndTime, Location, Status)
SELECT
    m.MatchID,
    DATE(m.MatchDate),
    ADDTIME('09:00:00', SEC_TO_TIME(meeting_seed.MatchOffset * 1800)),
    ADDTIME('09:30:00', SEC_TO_TIME(meeting_seed.MatchOffset * 1800)),
    CASE meeting_seed.MatchOffset
        WHEN 0 THEN 'Virtual - Reading'
        WHEN 1 THEN 'Virtual - Hiking'
        WHEN 2 THEN 'Virtual - Cooking'
        WHEN 3 THEN 'Virtual - Cycling and Technology'
        WHEN 4 THEN 'Virtual - Photography'
        WHEN 5 THEN 'Virtual - Running'
        WHEN 6 THEN 'Virtual - Gardening'
        WHEN 7 THEN 'Virtual - Reading'
        WHEN 8 THEN 'Virtual - Board Games'
        WHEN 9 THEN 'Virtual - Travel'
        WHEN 10 THEN 'Virtual - Volunteering'
        WHEN 11 THEN 'Virtual - Live Music'
        WHEN 12 THEN 'Virtual - Technology'
        WHEN 13 THEN 'Virtual - Technology'
        WHEN 14 THEN 'Virtual - Yoga'
        WHEN 15 THEN 'Virtual - Reading'
        WHEN 16 THEN 'Virtual - Board Games'
        WHEN 17 THEN 'Virtual - Photography'
        WHEN 18 THEN 'Virtual - Coffee'
        WHEN 19 THEN 'Virtual - Volunteering'
    END,
    m.MatchStatus
FROM (
    SELECT 0 AS MatchOffset
    UNION ALL SELECT 1
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
    UNION ALL SELECT 6
    UNION ALL SELECT 7
    UNION ALL SELECT 8
    UNION ALL SELECT 9
    UNION ALL SELECT 10
    UNION ALL SELECT 11
    UNION ALL SELECT 12
    UNION ALL SELECT 13
    UNION ALL SELECT 14
    UNION ALL SELECT 15
    UNION ALL SELECT 16
    UNION ALL SELECT 17
    UNION ALL SELECT 18
    UNION ALL SELECT 19
) AS meeting_seed
JOIN `Match` m ON m.MatchID = @seed_match_first_id + meeting_seed.MatchOffset;