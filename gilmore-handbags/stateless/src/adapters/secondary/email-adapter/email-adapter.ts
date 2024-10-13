import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

import { logger } from '@shared/logger';

const sesClient = new SESClient();

export async function sendEmail(
  sourceEmail: string,
  toAddresses: string[],
  subject: string,
  emailBody: string
): Promise<void> {
  try {
    const params = {
      Source: sourceEmail,
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Text: {
            Data: emailBody,
          },
        },
      },
    };

    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    logger.info(`email sent successfully for message ${response.MessageId}`);
  } catch (error) {
    logger.error(`error sending email:', ${error}`);
    throw error;
  }
}
