CREATE TABLE `contact_invites` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `inviter_id` INTEGER NOT NULL,
  `inviter_relationship_id` INTEGER NOT NULL,
  `token` VARCHAR(32) NOT NULL,
  `display_name` VARCHAR(32) NOT NULL,
  `relationship_type` VARCHAR(16) NOT NULL,
  `message` VARCHAR(160) NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING',
  `expires_at` DATETIME(3) NOT NULL,
  `accepted_by_id` INTEGER NULL,
  `accepted_at` DATETIME(3) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `contact_invites_token_key`(`token`),
  INDEX `contact_invites_inviter_id_status_idx`(`inviter_id`, `status`),
  INDEX `contact_invites_inviter_relationship_id_idx`(`inviter_relationship_id`),
  INDEX `contact_invites_token_idx`(`token`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `contact_connections` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `user_a_id` INTEGER NOT NULL,
  `user_b_id` INTEGER NOT NULL,
  `relationship_a_id` INTEGER NULL,
  `relationship_b_id` INTEGER NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'ACTIVE',
  `created_by_id` INTEGER NOT NULL,
  `shared_space_id` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  `disconnected_at` DATETIME(3) NULL,
  UNIQUE INDEX `contact_connections_user_a_id_user_b_id_key`(`user_a_id`, `user_b_id`),
  INDEX `contact_connections_user_a_id_status_idx`(`user_a_id`, `status`),
  INDEX `contact_connections_user_b_id_status_idx`(`user_b_id`, `status`),
  INDEX `contact_connections_shared_space_id_idx`(`shared_space_id`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `contact_invites` ADD CONSTRAINT `contact_invites_inviter_id_fkey` FOREIGN KEY (`inviter_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `contact_invites` ADD CONSTRAINT `contact_invites_inviter_relationship_id_fkey` FOREIGN KEY (`inviter_relationship_id`) REFERENCES `relationships`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `contact_invites` ADD CONSTRAINT `contact_invites_accepted_by_id_fkey` FOREIGN KEY (`accepted_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `contact_connections` ADD CONSTRAINT `contact_connections_user_a_id_fkey` FOREIGN KEY (`user_a_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `contact_connections` ADD CONSTRAINT `contact_connections_user_b_id_fkey` FOREIGN KEY (`user_b_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `contact_connections` ADD CONSTRAINT `contact_connections_relationship_a_id_fkey` FOREIGN KEY (`relationship_a_id`) REFERENCES `relationships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `contact_connections` ADD CONSTRAINT `contact_connections_relationship_b_id_fkey` FOREIGN KEY (`relationship_b_id`) REFERENCES `relationships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `contact_connections` ADD CONSTRAINT `contact_connections_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `contact_connections` ADD CONSTRAINT `contact_connections_shared_space_id_fkey` FOREIGN KEY (`shared_space_id`) REFERENCES `shared_spaces`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
