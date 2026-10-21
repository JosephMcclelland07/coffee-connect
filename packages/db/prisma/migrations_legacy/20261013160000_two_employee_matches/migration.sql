-- Stop before changing the schema if existing matches do not have exactly two participants.
CREATE TEMPORARY TABLE `_MatchPairValidation` (
    `MatchID` INTEGER NOT NULL,
    `ParticipantCount` INTEGER NOT NULL,
    PRIMARY KEY (`MatchID`),
    CONSTRAINT `_MatchPairValidation_count_check` CHECK (`ParticipantCount` = 2)
);

INSERT INTO `_MatchPairValidation` (`MatchID`, `ParticipantCount`)
SELECT m.`MatchID`, COUNT(mp.`MatchParticipantID`)
FROM `Match` m
LEFT JOIN `Match_Participant` mp ON mp.`MatchID` = m.`MatchID`
GROUP BY m.`MatchID`;

DROP TEMPORARY TABLE `_MatchPairValidation`;

ALTER TABLE `Match`
    ADD COLUMN `EmployeeOneID` INTEGER NULL,
    ADD COLUMN `EmployeeTwoID` INTEGER NULL;

UPDATE `Match` m
JOIN (
    SELECT `MatchID`,
        MAX(CASE WHEN `ParticipantPosition` = 1 THEN `EmployeeID` END) AS `EmployeeOneID`,
        MAX(CASE WHEN `ParticipantPosition` = 2 THEN `EmployeeID` END) AS `EmployeeTwoID`
    FROM (
        SELECT `MatchID`, `EmployeeID`,
            ROW_NUMBER() OVER (
                PARTITION BY `MatchID`
                ORDER BY `MatchParticipantID`
            ) AS `ParticipantPosition`
        FROM `Match_Participant`
    ) ranked_participants
    GROUP BY `MatchID`
) participants ON participants.`MatchID` = m.`MatchID`
SET
    m.`EmployeeOneID` = participants.`EmployeeOneID`,
    m.`EmployeeTwoID` = participants.`EmployeeTwoID`;

ALTER TABLE `Match`
    MODIFY COLUMN `EmployeeOneID` INTEGER NOT NULL,
    MODIFY COLUMN `EmployeeTwoID` INTEGER NOT NULL,
    ADD INDEX `IX_Match_EmployeeOneID` (`EmployeeOneID`),
    ADD INDEX `IX_Match_EmployeeTwoID` (`EmployeeTwoID`),
    ADD CONSTRAINT `Match_EmployeeOneID_fkey`
        FOREIGN KEY (`EmployeeOneID`) REFERENCES `Employee` (`EmployeeID`)
        ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT `Match_EmployeeTwoID_fkey`
        FOREIGN KEY (`EmployeeTwoID`) REFERENCES `Employee` (`EmployeeID`)
        ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE `Match_Participant`;