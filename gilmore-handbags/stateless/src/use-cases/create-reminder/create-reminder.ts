import { CreateReminder, Reminder } from '@dto/reminder';
import { getISOString, logger, schemaValidator } from '@shared';

import { config } from '@config';
import { schema } from '@schemas/reminder';
import { upsert } from '@adapters/secondary/dynamodb-adapter';
import { v4 as uuid } from 'uuid';

const tableName = config.get('tableName');

export async function createReminderUseCase(
  createReminder: CreateReminder
): Promise<Reminder> {
  const createdDate = getISOString();

  const reminder: Reminder = {
    id: uuid(),
    created: createdDate,
    updated: createdDate,
    ...createReminder,
  };

  schemaValidator(schema, reminder);

  await upsert<Reminder>(reminder, tableName, reminder.id);

  logger.info(`reminder created for user ${createReminder.userEmail}`);

  return reminder;
}
