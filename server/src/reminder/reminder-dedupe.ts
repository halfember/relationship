type ReminderOccurrence = {
  userId: number;
  sourceType: string;
  eventId: number | null;
  sharedEventId: number | null;
  eventDate: Date;
};

export function reminderOccurrenceKey(reminder: ReminderOccurrence): string {
  const sourceId = reminder.sourceType === 'SPACE' ? reminder.sharedEventId : reminder.eventId;
  return [reminder.userId, reminder.sourceType, sourceId, reminder.eventDate.toISOString()].join('|');
}

export function deduplicateReminderOccurrences<T extends ReminderOccurrence>(reminders: T[]): T[] {
  const unique = new Map<string, T>();
  for (const reminder of reminders) {
    const key = reminderOccurrenceKey(reminder);
    if (!unique.has(key)) unique.set(key, reminder);
  }
  return [...unique.values()];
}
