import * as cdk from 'aws-cdk-lib';
import { PipelineIamStack } from '../lib/pipeline-iam-stack';
import { defaultConfig } from '../lib/config';

const app = new cdk.App();

new PipelineIamStack(app, 'AwsPipelineIamBootstrapStack', {
  description: 'Central AWS IAM OIDC & CI/CD Deployment Roles Bootstrap Stack',
  config: defaultConfig,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || '334624057595',
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

app.synth();
