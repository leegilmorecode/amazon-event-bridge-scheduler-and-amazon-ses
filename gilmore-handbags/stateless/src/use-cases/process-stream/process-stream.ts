import { Reminder } from '@dto/reminder';
import { config } from '@config';
import { logger } from '@shared';
import { scheduleEvent } from '@adapters/secondary/schedule-events';

const destinationQueueArn = config.get('destinationQueueArn');
const scheduleRoleArn = config.get('scheduleRoleArn');
const scheduleGroupName = config.get('scheduleGroupName');
const destinationDeadLetterQueueArn = config.get(
  'destinationDeadLetterQueueArn'
);

export async function processStreamUseCase(
  reminder: Reminder
): Promise<Reminder> {
  await scheduleEvent(
    reminder,
    destinationQueueArn,
    scheduleRoleArn,
    scheduleGroupName,
    destinationDeadLetterQueueArn
  );

  logger.info(
    `reminder scheduled for user ${reminder.userEmail} for date ${reminder.reminderDate}`
  );

  return reminder;
}
