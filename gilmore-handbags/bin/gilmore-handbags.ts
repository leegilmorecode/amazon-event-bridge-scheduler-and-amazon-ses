#!/usr/bin/env node

import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';

import { GilmoreHandbagsStatefulStack } from '../stateful/stateful';
import { GilmoreHandbagsStatelessStack } from '../stateless/stateless';

const app = new cdk.App();

const stage = 'develop';
const fromEmailAddress = 'reminders@serverlessadvocate.com'; // Note: this will be your verified email or domain

const statefulStack = new GilmoreHandbagsStatefulStack(
  app,
  'GilmoreHandbagsStatefulStack',
  {
    stage,
  }
);
new GilmoreHandbagsStatelessStack(app, 'GilmoreHandbagsStatelessStack', {
  stage,
  table: statefulStack.table,
  fromEmailAddress,
});
