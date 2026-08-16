-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `openid` VARCHAR(64) NOT NULL,
    `nickname` VARCHAR(32) NULL,
    `avatar` VARCHAR(255) NULL,
    `vipLevel` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `users_openid_key`(`openid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `relationships` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `name` VARCHAR(32) NOT NULL,
    `type` VARCHAR(16) NOT NULL,
    `avatar` VARCHAR(255) NULL,
    `birthday` DATETIME(3) NULL,
    `tags` JSON NULL,
    `remark` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `relationships_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `relationship_id` INTEGER NOT NULL,
    `title` VARCHAR(64) NOT NULL,
    `event_date` DATETIME(3) NOT NULL,
    `repeat_type` VARCHAR(16) NULL,
    `remind_days` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `events_relationship_id_idx`(`relationship_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `memories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `relationship_id` INTEGER NOT NULL,
    `image_url` VARCHAR(255) NULL,
    `content` TEXT NULL,
    `memory_date` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `memories_relationship_id_idx`(`relationship_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `reminders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `relationship_id` INTEGER NOT NULL,
    `event_id` INTEGER NOT NULL,
    `event_title` VARCHAR(128) NOT NULL,
    `relationship_name` VARCHAR(64) NOT NULL,
    `event_date` DATETIME(3) NOT NULL,
    `remind_date` DATETIME(3) NOT NULL,
    `days_until` INTEGER NOT NULL,
    `sent` BOOLEAN NOT NULL DEFAULT false,
    `sent_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `reminders_user_id_idx`(`user_id`),
    INDEX `reminders_remind_date_idx`(`remind_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `share_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `relationship_id` INTEGER NOT NULL,
    `token` VARCHAR(8) NOT NULL,
    `expires_at` DATETIME(3) NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `share_tokens_token_key`(`token`),
    INDEX `share_tokens_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shared_access` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `owner_id` INTEGER NOT NULL,
    `viewer_id` INTEGER NOT NULL,
    `relationship_id` INTEGER NOT NULL,
    `permission` VARCHAR(8) NOT NULL DEFAULT 'view',
    `accepted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `shared_access_viewer_id_idx`(`viewer_id`),
    INDEX `shared_access_owner_id_idx`(`owner_id`),
    UNIQUE INDEX `shared_access_owner_id_viewer_id_relationship_id_key`(`owner_id`, `viewer_id`, `relationship_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ai_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(32) NOT NULL,
    `prompt` TEXT NOT NULL,
    `result` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ai_records_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `relationships` ADD CONSTRAINT `relationships_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `events` ADD CONSTRAINT `events_relationship_id_fkey` FOREIGN KEY (`relationship_id`) REFERENCES `relationships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `memories` ADD CONSTRAINT `memories_relationship_id_fkey` FOREIGN KEY (`relationship_id`) REFERENCES `relationships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
