import convict = require('convict');

export const config = convict({
  tableName: {
    doc: 'The dynamodb table',
    default: '',
    env: 'TABLE_NAME',
    nullable: false,
  },
  destinationQueueArn: {
    doc: 'The destination sqs queue arn',
    default: '',
    env: 'QUEUE_ARN',
    nullable: false,
  },
  destinationDeadLetterQueueArn: {
    doc: 'The destination sqs dead letter queue arn',
    default: '',
    env: 'DEAD_LETTER_QUEUE_ARN',
    nullable: false,
  },
  scheduleRoleArn: {
    doc: 'The schedule role arn',
    default: '',
    env: 'SCHEDULE_ROLE_ARN',
    nullable: false,
  },
  scheduleGroupName: {
    doc: 'The schedule group name',
    default: '',
    env: 'SCHEDULE_GROUP_NAME',
    nullable: false,
  },
  fromEmailAddress: {
    doc: 'The from email address for sending of emails',
    default: '',
    env: 'FROM_EMAIL_ADDRESS',
    nullable: false,
  },
});
