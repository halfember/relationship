ALTER TABLE `reminders`
  MODIFY COLUMN `relationship_id` INTEGER NULL,
  MODIFY COLUMN `event_id` INTEGER NULL,
  ADD COLUMN `source_type` VARCHAR(16) NOT NULL DEFAULT 'RELATIONSHIP',
  ADD COLUMN `shared_space_id` INTEGER NULL,
  ADD COLUMN `shared_event_id` INTEGER NULL;

CREATE INDEX `reminders_user_id_source_type_idx` ON `reminders`(`user_id`, `source_type`);
CREATE INDEX `reminders_shared_space_id_idx` ON `reminders`(`shared_space_id`);
CREATE INDEX `reminders_shared_event_id_idx` ON `reminders`(`shared_event_id`);

UPDATE `relationships`
SET `type` = CASE `type`
  WHEN 'friend' THEN '朋友'
  WHEN 'family' THEN '家人'
  WHEN 'lover' THEN '恋人'
  WHEN 'colleague' THEN '同事'
  WHEN 'classmate' THEN '同学'
  WHEN 'other' THEN '其他'
  ELSE `type`
END
WHERE `type` IN ('friend', 'family', 'lover', 'colleague', 'classmate', 'other');
