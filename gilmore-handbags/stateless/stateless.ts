import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as path from 'path';
import * as scheduler from 'aws-cdk-lib/aws-scheduler';
import * as sqs from 'aws-cdk-lib/aws-sqs';

import { Construct } from 'constructs';

export interface GilmoreHandbagsStatelessStackProps extends cdk.StackProps {
  stage: string;
  table: dynamodb.Table;
  fromEmailAddress: string;
}

export class GilmoreHandbagsStatelessStack extends cdk.Stack {
  private table: dynamodb.Table;
  private queue: sqs.Queue;
  private deadLetterQueue: sqs.Queue;
  public api: apigw.RestApi;

  constructor(
    scope: Construct,
    id: string,
    props: GilmoreHandbagsStatelessStackProps
  ) {
    super(scope, id, props);

    const { stage, table, fromEmailAddress } = props;

    this.table = table;

    const lambdaPowerToolsConfig = {
      LOG_LEVEL: 'DEBUG',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '1',
      POWERTOOLS_TRACE_ENABLED: 'true',
      POWERTOOLS_TRACER_CAPTURE_HTTPS_REQUESTS: 'true',
      POWERTOOLS_SERVICE_NAME: 'gilmore-handbags-reminder-service',
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_METRICS_NAMESPACE: 'gilmore.handbags.com',
    };

    // create the reminder processing sqs queue
    this.queue = new sqs.Queue(this, 'ReminderProcessingQueue', {
      queueName: `${stage}-gilmore-handbags-reminder-processing-queue`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // create the reminder processing sqs dead letter queue
    this.deadLetterQueue = new sqs.Queue(
      this,
      'ReminderProcessingDeadLetterQueue',
      {
        queueName: `${stage}-gilmore-handbags-reminder-processing-dead-letter-queue`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // create a new schedule group (this will store our scheduled events)
    const scheduleGroup = new scheduler.CfnScheduleGroup(
      this,
      'RemindersScheduleGroup',
      {
        name: `${stage}-gilmore-handbags-reminders-schedule-group`,
      }
    );

    // ensure the scheduler can send messages to the sqs queue
    const launchRole = new iam.Role(this, 'SchedulerRole', {
      assumedBy: new iam.ServicePrincipal('scheduler.amazonaws.com'),
    });
    new iam.Policy(this, 'SchedulePolicy', {
      policyName: 'ScheduleToSendSqSMessage',
      roles: [launchRole],
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'sqs:SendMessage',
            'sqs:GetQueueAttributes',
            'sqs:GetQueueUrl',
          ],
          resources: [this.queue.queueArn],
        }),
      ],
    });

    // create the reminder service lambda function
    const createReminderLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'CreateReminderLambda', {
        functionName: `${props.stage}-gilmore-handbags-create-reminder`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          '../stateless/src/adapters/primary/create-reminder/create-reminder.adapter.ts'
        ),
        memorySize: 1024,
        handler: 'handler',
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['@aws-sdk/*'],
        },
        environment: {
          ...lambdaPowerToolsConfig,
          TABLE_NAME: this.table.tableName,
        },
      });

    // create the stream processor lambda function
    const streamProcessorLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'StreamProcessorLambda', {
        functionName: `${props.stage}-gilmore-handbags-stream-processor`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          '../stateless/src/adapters/primary/stream-processor/stream-processor.adapter.ts'
        ),
        memorySize: 1024,
        handler: 'handler',
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['@aws-sdk/*'],
        },
        environment: {
          ...lambdaPowerToolsConfig,
          SCHEDULE_GROUP_NAME: scheduleGroup.name as string,
          SCHEDULE_ROLE_ARN: launchRole.roleArn,
          QUEUE_ARN: this.queue.queueArn,
          DEAD_LETTER_QUEUE_ARN: this.deadLetterQueue.queueArn,
        },
        // ensure we can create new scheduled events
        initialPolicy: [
          new iam.PolicyStatement({
            actions: [
              'scheduler:CreateSchedule',
              'iam:PassRole',
              'scheduler:CreateScheduleGroup',
            ],
            resources: ['*'],
          }),
        ],
      });

    // create the queue processor lambda function
    const queueProcessorLambda: nodeLambda.NodejsFunction =
      new nodeLambda.NodejsFunction(this, 'QueueProcessorLambda', {
        functionName: `${props.stage}-gilmore-handbags-queue-processor`,
        runtime: lambda.Runtime.NODEJS_20_X,
        entry: path.join(
          __dirname,
          '../stateless/src/adapters/primary/queue-processor/queue-processor.adapter.ts'
        ),
        memorySize: 1024,
        handler: 'handler',
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
          sourceMap: true,
          externalModules: ['@aws-sdk/*'],
        },
        environment: {
          ...lambdaPowerToolsConfig,
          FROM_EMAIL_ADDRESS: fromEmailAddress,
        },
      });

    // enable the function to write reminders to the dynamodb table
    this.table.grantWriteData(createReminderLambda);

    // create our rest api for creating reminders
    this.api = new apigw.RestApi(this, 'Api', {
      description: `(${stage}) handbag reminders api`,
      restApiName: `${stage}-gilmore-handbags-api`,
      deploy: true,
      deployOptions: {
        stageName: 'api',
        loggingLevel: apigw.MethodLoggingLevel.INFO,
      },
    });

    const root: apigw.Resource = this.api.root.addResource('v1');
    const appointments: apigw.Resource = root.addResource('reminders');

    // point the api resource to the lambda function
    appointments.addMethod(
      'POST',
      new apigw.LambdaIntegration(createReminderLambda, {
        proxy: true,
      })
    );

    // allow the stream processor function to read from the ddb stream
    streamProcessorLambda.addEventSource(
      new lambdaEventSources.DynamoEventSource(this.table, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
        retryAttempts: 1,
        reportBatchItemFailures: true,
      })
    );

    // ensure the email queue processor lambda function can read the sqs queue
    queueProcessorLambda.addEventSource(
      new lambdaEventSources.SqsEventSource(this.queue, {
        batchSize: 10,
        maxConcurrency: 2,
        reportBatchItemFailures: true,
      })
    );

    // allow the queue processor lambda function to send emails using ses
    queueProcessorLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      })
    );
  }
}
