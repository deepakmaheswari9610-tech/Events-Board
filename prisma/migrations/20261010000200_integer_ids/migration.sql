-- Preserve all rows while converting string keys to INT AUTO_INCREMENT.
-- Stop application writes while this MySQL DDL migration runs.
-- Keep sample event IDs 1..15 stable; other events receive IDs starting at 16.
CREATE TEMPORARY TABLE `_EventIdMap` (
  `oldId` VARCHAR(191) NOT NULL,
  `newId` INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`newId`),
  UNIQUE KEY (`oldId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci AUTO_INCREMENT=16;
INSERT INTO `_EventIdMap` (`oldId`, `newId`)
  SELECT `id`, CAST(SUBSTRING(`id`, 14) AS UNSIGNED) FROM `Event`
  WHERE `id` REGEXP '^sample-event-(0[1-9]|1[0-5])$';
INSERT INTO `_EventIdMap` (`oldId`)
  SELECT `id` FROM `Event`
  WHERE `id` NOT REGEXP '^sample-event-(0[1-9]|1[0-5])$'
  ORDER BY `createdAt`, `id`;

ALTER TABLE `User` ADD COLUMN `newId` INT NOT NULL AUTO_INCREMENT,
  ADD UNIQUE INDEX `User_newId_key` (`newId`);
ALTER TABLE `Event` ADD COLUMN `newId` INT NULL;
UPDATE `Event` e JOIN `_EventIdMap` m ON m.`oldId`=e.`id`
  SET e.`newId`=m.`newId`;

ALTER TABLE `FavouriteCategory` ADD COLUMN `newUserId` INT NULL;
UPDATE `FavouriteCategory` c JOIN `User` p ON c.`userId`=p.`id` SET c.`newUserId`=p.`newId`;

ALTER TABLE `Reminder` ADD COLUMN `newUserId` INT NULL;
UPDATE `Reminder` c JOIN `User` p ON c.`userId`=p.`id` SET c.`newUserId`=p.`newId`;

ALTER TABLE `Reminder` ADD COLUMN `newEventId` INT NULL;
UPDATE `Reminder` c JOIN `Event` p ON c.`eventId`=p.`id` SET c.`newEventId`=p.`newId`;

ALTER TABLE `CardDesign` ADD COLUMN `newUserId` INT NULL;
UPDATE `CardDesign` c JOIN `User` p ON c.`userId`=p.`id` SET c.`newUserId`=p.`newId`;

ALTER TABLE `CardDesign` ADD COLUMN `newEventId` INT NULL;
UPDATE `CardDesign` c JOIN `Event` p ON c.`eventId`=p.`id` SET c.`newEventId`=p.`newId`;

ALTER TABLE `FavouriteCategory` DROP FOREIGN KEY `FavouriteCategory_userId_fkey`;

ALTER TABLE `Reminder` DROP FOREIGN KEY `Reminder_userId_fkey`;

ALTER TABLE `Reminder` DROP FOREIGN KEY `Reminder_eventId_fkey`;

ALTER TABLE `CardDesign` DROP FOREIGN KEY `CardDesign_userId_fkey`;

ALTER TABLE `CardDesign` DROP FOREIGN KEY `CardDesign_eventId_fkey`;

ALTER TABLE `User` DROP PRIMARY KEY, DROP INDEX `User_newId_key`,
  DROP COLUMN `id`, CHANGE COLUMN `newId` `id` INT NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
ALTER TABLE `Event` DROP PRIMARY KEY, DROP COLUMN `id`,
  CHANGE COLUMN `newId` `id` INT NOT NULL AUTO_INCREMENT,
  ADD PRIMARY KEY (`id`);
-- Reserve 1..15 for the idempotent sample seed, even on an initially empty DB.
SET @next_event_id = (SELECT GREATEST(COALESCE(MAX(`id`), 0) + 1, 16) FROM `Event`);
SET @event_sequence_sql = CONCAT('ALTER TABLE `Event` AUTO_INCREMENT = ', @next_event_id);
PREPARE event_sequence FROM @event_sequence_sql;
EXECUTE event_sequence;
DEALLOCATE PREPARE event_sequence;

ALTER TABLE `FavouriteCategory` DROP PRIMARY KEY,
  DROP COLUMN `userId`,
  CHANGE COLUMN `newUserId` `userId` INT NOT NULL,
  ADD PRIMARY KEY (`userId`, `category`);

ALTER TABLE `Reminder` DROP PRIMARY KEY,
  DROP INDEX `Reminder_eventId_idx`,
  DROP COLUMN `userId`,
  CHANGE COLUMN `newUserId` `userId` INT NOT NULL,
  DROP COLUMN `eventId`,
  CHANGE COLUMN `newEventId` `eventId` INT NOT NULL,
  ADD PRIMARY KEY (`userId`, `eventId`),
  ADD INDEX `Reminder_eventId_idx` (`eventId`);

ALTER TABLE `CardDesign` DROP PRIMARY KEY,
  DROP INDEX `CardDesign_eventId_idx`,
  DROP COLUMN `userId`,
  CHANGE COLUMN `newUserId` `userId` INT NOT NULL,
  DROP COLUMN `eventId`,
  CHANGE COLUMN `newEventId` `eventId` INT NOT NULL,
  ADD PRIMARY KEY (`userId`, `eventId`),
  ADD INDEX `CardDesign_eventId_idx` (`eventId`);

ALTER TABLE `FavouriteCategory` ADD CONSTRAINT `FavouriteCategory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Reminder` ADD CONSTRAINT `Reminder_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `CardDesign` ADD CONSTRAINT `CardDesign_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `CardDesign` ADD CONSTRAINT `CardDesign_eventId_fkey` FOREIGN KEY (`eventId`) REFERENCES `Event` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

DROP TEMPORARY TABLE `_EventIdMap`;
