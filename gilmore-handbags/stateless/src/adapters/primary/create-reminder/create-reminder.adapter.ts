import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CreateReminder, Reminder } from '@dto/reminder';
import { MetricUnit, Metrics } from '@aws-lambda-powertools/metrics';
import { errorHandler, logger, schemaValidator } from '@shared';

import { Tracer } from '@aws-lambda-powertools/tracer';
import { ValidationError } from '@errors/validation-error';
import { captureLambdaHandler } from '@aws-lambda-powertools/tracer/middleware';
import { createReminderUseCase } from '@use-cases/create-reminder';
import { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';
import { logMetrics } from '@aws-lambda-powertools/metrics/middleware';
import middy from '@middy/core';
import { schema } from './create-reminder.schema';

const tracer = new Tracer();
const metrics = new Metrics();

export const createReminderAdapter = async ({
  body,
}: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!body) throw new ValidationError('no payload body');

    const reminder = JSON.parse(body) as CreateReminder;

    schemaValidator(schema, reminder);

    const created: Reminder = await createReminderUseCase(reminder);

    metrics.addMetric('SuccessfulCreateReminder', MetricUnit.Count, 1);

    return {
      statusCode: 201,
      body: JSON.stringify(created),
    };
  } catch (error) {
    let errorMessage = 'Unknown error';
    if (error instanceof Error) errorMessage = error.message;
    logger.error(errorMessage);

    metrics.addMetric('CreateReminderError', MetricUnit.Count, 1);

    return errorHandler(error);
  }
};

export const handler = middy(createReminderAdapter)
  .use(injectLambdaContext(logger))
  .use(captureLambdaHandler(tracer))
  .use(logMetrics(metrics));
