import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

import { Construct } from 'constructs';

export interface GilmoreHandbagsStatefulStackProps extends cdk.StackProps {
  stage: string;
}

export class GilmoreHandbagsStatefulStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(
    scope: Construct,
    id: string,
    props: GilmoreHandbagsStatefulStackProps
  ) {
    super(scope, id, props);

    const { stage } = props;

    // create the table which stores our customers reminders
    this.table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: `lg-gilmore-handbags-table-${stage}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      stream: dynamodb.StreamViewType.NEW_IMAGE, // enable streams
    });
  }
}
