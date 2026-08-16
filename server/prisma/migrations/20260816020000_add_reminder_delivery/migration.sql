ALTER TABLE `reminders`
  ADD COLUMN `delivery_status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `attempt_count` INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN `last_attempt_at` DATETIME(3) NULL,
  ADD COLUMN `next_attempt_at` DATETIME(3) NULL,
  ADD COLUMN `failure_code` VARCHAR(32) NULL,
  ADD COLUMN `failure_message` VARCHAR(255) NULL,
  ADD COLUMN `acknowledged` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `acknowledged_at` DATETIME(3) NULL;

CREATE INDEX `reminders_delivery_status_remind_date_next_attempt_at_idx`
  ON `reminders`(`delivery_status`, `remind_date`, `next_attempt_at`);

DELETE `r`
FROM `reminders` AS `r`
LEFT JOIN `users` AS `u` ON `u`.`id` = `r`.`user_id`
WHERE `u`.`id` IS NULL;

ALTER TABLE `reminders`
  ADD CONSTRAINT `reminders_user_id_fkey`
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
