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
    ('Poppy', 'Bailey', 'poppy.bailey@example.com', 'London', 'Engineering', 'Backend Developer', TRUE, CURRENT_TIMESTAMP)
ON DUPLICATE KEY UPDATE
    FirstName = VALUES(FirstName),
    LastName = VALUES(LastName),
    OfficeLocation = VALUES(OfficeLocation),
    Department = VALUES(Department),
    Role = VALUES(Role),
    IsActive = VALUES(IsActive);


INSERT INTO Interest_Category (CategoryName)
VALUES
    ('Outdoors'),
    ('Food & Drink'),
    ('Creative'),
    ('Social'),
    ('Wellness'),
    ('Technology')
ON DUPLICATE KEY UPDATE
    CategoryName = VALUES(CategoryName);

INSERT INTO Interest (InterestName, CategoryID)
SELECT
    interest_seed.InterestName,
    category.InterestCategoryID
FROM (
    SELECT 'Hiking' AS InterestName, 'Outdoors' AS CategoryName
    UNION ALL SELECT 'Cycling', 'Outdoors'
    UNION ALL SELECT 'Running', 'Outdoors'
    UNION ALL SELECT 'Gardening', 'Outdoors'
    UNION ALL SELECT 'Cooking', 'Food & Drink'
    UNION ALL SELECT 'Coffee', 'Food & Drink'
    UNION ALL SELECT 'Reading', 'Creative'
    UNION ALL SELECT 'Photography', 'Creative'
    UNION ALL SELECT 'Live Music', 'Creative'
    UNION ALL SELECT 'Art', 'Creative'
    UNION ALL SELECT 'Board Games', 'Social'
    UNION ALL SELECT 'Travel', 'Social'
    UNION ALL SELECT 'Volunteering', 'Social'
    UNION ALL SELECT 'Yoga', 'Wellness'
    UNION ALL SELECT 'Technology', 'Technology'
) AS interest_seed
JOIN Interest_Category category ON category.CategoryName = interest_seed.CategoryName
ON DUPLICATE KEY UPDATE
    CategoryID = VALUES(CategoryID);


INSERT INTO `Match` (
    MatchDate,
    MatchType,
    MatchStatus,
    GeneratedByWheelSpin,
    EmployeeOneID,
    EmployeeTwoID
)
SELECT
    TIMESTAMP('2026-01-01 09:00:00') + INTERVAL match_seed.MatchOffset DAY,
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
LEFT JOIN `Match` existing_match
    ON existing_match.EmployeeOneID = employee_one.EmployeeID
    AND existing_match.EmployeeTwoID = employee_two.EmployeeID
    AND existing_match.MatchDate = TIMESTAMP('2026-01-01 09:00:00') + INTERVAL match_seed.MatchOffset DAY
    AND existing_match.MatchType = 'Interest-Based'
    AND existing_match.MatchStatus = 'Completed'
    AND existing_match.GeneratedByWheelSpin = FALSE
WHERE existing_match.MatchID IS NULL
ORDER BY match_seed.MatchOffset;

