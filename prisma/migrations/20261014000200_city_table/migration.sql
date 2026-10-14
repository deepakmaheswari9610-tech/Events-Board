-- Preserve events while moving city names to integer foreign keys.
CREATE TABLE `City` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `City_name_key` (`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT INTO `City` (`name`) SELECT DISTINCT `city` FROM `Event` ORDER BY `city`;
ALTER TABLE `Event` ADD COLUMN `cityId` INTEGER NULL;
UPDATE `Event` e JOIN `City` c ON e.`city` = c.`name` SET e.`cityId` = c.`id`;
ALTER TABLE `Event` DROP INDEX `Event_active_categoryId_city_startsAt_idx`, DROP COLUMN `city`, MODIFY `cityId` INTEGER NOT NULL;
CREATE INDEX `Event_active_categoryId_cityId_startsAt_idx` ON `Event` (`active`, `categoryId`, `cityId`, `startsAt`);
CREATE INDEX `Event_cityId_fkey` ON `Event` (`cityId`);
ALTER TABLE `Event` ADD CONSTRAINT `Event_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `City` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
