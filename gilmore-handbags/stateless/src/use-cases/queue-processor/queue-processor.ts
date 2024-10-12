import { Reminder } from '@dto/reminder';
import { SQSRecord } from 'aws-lambda';
import { config } from '@config';
import { sendEmail } from '@adapters/secondary/email-adapter';

const fromEmailAddress = config.get('fromEmailAddress');

export async function queueProcessorUseCase(
  newEvent: SQSRecord
): Promise<SQSRecord> {
  const reminder = JSON.parse(newEvent.body) as Reminder;

  const emailSubject = `Reminder for Product ${reminder.productId}`;
  const emailBody =
    reminder.message ||
    `This is a reminder for your product (ID: ${reminder.productId}).`;

  await sendEmail(
    fromEmailAddress,
    [reminder.userEmail],
    emailSubject,
    emailBody
  );

  return newEvent;
}
