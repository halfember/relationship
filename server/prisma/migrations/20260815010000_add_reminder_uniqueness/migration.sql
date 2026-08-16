DELETE newer
FROM `reminders` newer
INNER JOIN `reminders` older
  ON newer.`user_id` = older.`user_id`
  AND newer.`event_id` = older.`event_id`
  AND newer.`remind_date` = older.`remind_date`
  AND newer.`id` > older.`id`
WHERE newer.`source_type` = 'RELATIONSHIP';

DELETE newer
FROM `reminders` newer
INNER JOIN `reminders` older
  ON newer.`user_id` = older.`user_id`
  AND newer.`shared_event_id` = older.`shared_event_id`
  AND newer.`remind_date` = older.`remind_date`
  AND newer.`id` > older.`id`
WHERE newer.`source_type` = 'SPACE';

CREATE UNIQUE INDEX `reminders_user_event_remind_date_key`
  ON `reminders`(`user_id`, `event_id`, `remind_date`);

CREATE UNIQUE INDEX `reminders_user_shared_event_remind_date_key`
  ON `reminders`(`user_id`, `shared_event_id`, `remind_date`);
