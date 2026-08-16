CREATE TABLE `desktop_login_codes` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `code_hash` CHAR(64) NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `used_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `desktop_login_codes_code_hash_key`(`code_hash`),
  INDEX `desktop_login_codes_user_id_expires_at_idx`(`user_id`, `expires_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `desktop_login_codes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `product_events` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_id` INTEGER NOT NULL,
  `event_name` VARCHAR(64) NOT NULL,
  `page` VARCHAR(128) NULL,
  `session_id` VARCHAR(64) NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `product_events_user_id_event_name_created_at_idx`(`user_id`, `event_name`, `created_at`),
  INDEX `product_events_created_at_idx`(`created_at`),
  PRIMARY KEY (`id`),
  CONSTRAINT `product_events_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
