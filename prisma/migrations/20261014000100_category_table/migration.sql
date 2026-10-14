-- Preserve existing events and favourite selections while replacing enum names with integer foreign keys.
CREATE TABLE `Category` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `Category_name_key` (`name`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT INTO `Category` (`name`) VALUES ('Music'), ('Workshop'), ('Food'), ('Sports'), ('Kids');
ALTER TABLE `Event` ADD COLUMN `categoryId` INTEGER NULL;
UPDATE `Event` e JOIN `Category` c ON CAST(e.`category` AS CHAR) COLLATE utf8mb4_unicode_ci = c.`name` SET e.`categoryId` = c.`id`;
ALTER TABLE `Event` DROP INDEX `Event_active_category_city_startsAt_idx`, DROP COLUMN `category`, MODIFY `categoryId` INTEGER NOT NULL;
CREATE INDEX `Event_active_categoryId_city_startsAt_idx` ON `Event` (`active`, `categoryId`, `city`, `startsAt`);
CREATE INDEX `Event_categoryId_fkey` ON `Event` (`categoryId`);
ALTER TABLE `Event` ADD CONSTRAINT `Event_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FavouriteCategory` ADD COLUMN `categoryId` INTEGER NULL;
UPDATE `FavouriteCategory` f JOIN `Category` c ON CAST(f.`category` AS CHAR) COLLATE utf8mb4_unicode_ci = c.`name` SET f.`categoryId` = c.`id`;
CREATE INDEX `FavouriteCategory_userId_migration_idx` ON `FavouriteCategory` (`userId`);
ALTER TABLE `FavouriteCategory` DROP PRIMARY KEY, DROP COLUMN `category`, MODIFY `categoryId` INTEGER NOT NULL, ADD PRIMARY KEY (`userId`, `categoryId`);
DROP INDEX `FavouriteCategory_userId_migration_idx` ON `FavouriteCategory`;
CREATE INDEX `FavouriteCategory_categoryId_idx` ON `FavouriteCategory` (`categoryId`);
ALTER TABLE `FavouriteCategory` ADD CONSTRAINT `FavouriteCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
