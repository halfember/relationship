ALTER TABLE `relationships`
  ADD COLUMN `shared_space_id` INTEGER NULL;

CREATE TABLE `shared_spaces` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `type` VARCHAR(16) NOT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  `name` VARCHAR(64) NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `created_by_id` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `shared_spaces_created_by_id_idx`(`created_by_id`),
  INDEX `shared_spaces_type_status_idx`(`type`, `status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `space_members` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `space_id` INTEGER NOT NULL,
  `user_id` INTEGER NULL,
  `display_name` VARCHAR(32) NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `role` VARCHAR(16) NOT NULL DEFAULT 'MEMBER',
  `status` VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  `relation_label` VARCHAR(32) NULL,
  `generation` VARCHAR(16) NULL,
  `birthday` DATETIME(3) NULL,
  `joined_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `space_members_space_id_status_idx`(`space_id`, `status`),
  INDEX `space_members_user_id_idx`(`user_id`),
  UNIQUE INDEX `space_members_space_id_user_id_key`(`space_id`, `user_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `space_invites` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `space_id` INTEGER NOT NULL,
  `inviter_id` INTEGER NOT NULL,
  `accepted_by_id` INTEGER NULL,
  `target_member_id` INTEGER NULL,
  `token` VARCHAR(32) NOT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  `expires_at` DATETIME(3) NOT NULL,
  `accepted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `space_invites_token_key`(`token`),
  INDEX `space_invites_space_id_status_idx`(`space_id`, `status`),
  INDEX `space_invites_inviter_id_idx`(`inviter_id`),
  INDEX `space_invites_token_idx`(`token`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shared_events` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `space_id` INTEGER NOT NULL,
  `title` VARCHAR(64) NOT NULL,
  `event_date` DATETIME(3) NOT NULL,
  `repeat_type` VARCHAR(16) NULL,
  `remind_days` JSON NULL,
  `created_by_id` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `shared_events_space_id_event_date_idx`(`space_id`, `event_date`),
  INDEX `shared_events_created_by_id_idx`(`created_by_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `shared_memories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `space_id` INTEGER NOT NULL,
  `image_url` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `memory_date` DATETIME(3) NULL,
  `created_by_id` INTEGER NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  INDEX `shared_memories_space_id_created_at_idx`(`space_id`, `created_at`),
  INDEX `shared_memories_created_by_id_idx`(`created_by_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `relationships_shared_space_id_idx` ON `relationships`(`shared_space_id`);
CREATE UNIQUE INDEX `relationships_user_id_shared_space_id_key` ON `relationships`(`user_id`, `shared_space_id`);

ALTER TABLE `relationships` ADD CONSTRAINT `relationships_shared_space_id_fkey` FOREIGN KEY (`shared_space_id`) REFERENCES `shared_spaces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `shared_spaces` ADD CONSTRAINT `shared_spaces_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `space_members` ADD CONSTRAINT `space_members_space_id_fkey` FOREIGN KEY (`space_id`) REFERENCES `shared_spaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `space_members` ADD CONSTRAINT `space_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `space_invites` ADD CONSTRAINT `space_invites_space_id_fkey` FOREIGN KEY (`space_id`) REFERENCES `shared_spaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `space_invites` ADD CONSTRAINT `space_invites_inviter_id_fkey` FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `space_invites` ADD CONSTRAINT `space_invites_accepted_by_id_fkey` FOREIGN KEY (`accepted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `space_invites` ADD CONSTRAINT `space_invites_target_member_id_fkey` FOREIGN KEY (`target_member_id`) REFERENCES `space_members`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `shared_events` ADD CONSTRAINT `shared_events_space_id_fkey` FOREIGN KEY (`space_id`) REFERENCES `shared_spaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `shared_events` ADD CONSTRAINT `shared_events_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `shared_memories` ADD CONSTRAINT `shared_memories_space_id_fkey` FOREIGN KEY (`space_id`) REFERENCES `shared_spaces`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `shared_memories` ADD CONSTRAINT `shared_memories_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
