import { DynamoDBRecord, DynamoDBStreamEvent } from 'aws-lambda';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';

import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { Reminder } from '@dto/reminder';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import { logger } from '@shared/index';
import middy from '@middy/core';
import { processStreamUseCase } from '@use-cases/process-stream';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const tracer = new Tracer();
const metrics = new Metrics();
type StreamRecord = Record<string, AttributeValue>;

const processStreamRecord = async (record: DynamoDBRecord): Promise<void> => {
  const { dynamodb, eventName } = record;

  if (!dynamodb || !dynamodb.Keys || !dynamodb.NewImage || !eventName) {
    return;
  }

  const dynamoDBRecord = record.dynamodb;

  const reminder = unmarshall(
    dynamoDBRecord?.NewImage as StreamRecord
  ) as Reminder;

  logger.info('DynamoDB Record:', reminder);

  await processStreamUseCase(reminder);

  metrics.addMetric('CreateScheduledReminderSuccess', MetricUnit.Count, 1);
};

export const processStreamAdapter = async (
  event: DynamoDBStreamEvent
): Promise<void> => {
  try {
    const records: DynamoDBRecord[] = event.Records;

    const processPromises: Promise<void>[] = records.map(
      (record: DynamoDBRecord) => processStreamRecord(record)
    );
    await Promise.all(processPromises);
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('CreateScheduledReminderError', MetricUnit.Count, 1);

    throw error;
  }
};

export const handler = middy(processStreamAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
