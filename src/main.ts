import { App, aws_apigateway, aws_lambda, Stack } from 'aws-cdk-lib';

const app = new App();

const stack = new Stack(app, 'cdk-alias-hotswap-bug', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const handler = new aws_lambda.Function(stack, 'Handler', {
  code: aws_lambda.Code.fromInline([
    'def handler(event, ctx):',
    '  return { "statusCode": 200, "body": "{}" }',
    // Introduce randomness for convenience so you can hit save on this file
    // to redeploy and trigger the bug.
    `  #${Math.random()}`,
    '',
  ].join('\n')),
  runtime: aws_lambda.Runtime.PYTHON_3_9,
  handler: 'index.handler',
});

// Add provisioned concurrency
const handlerAlias = handler.addAlias('abcd', {
  provisionedConcurrentExecutions: 3,
});

// Use the provisioned concurrency as the rest api handler
new aws_apigateway.LambdaRestApi(stack, 'Api', {
  handler: handlerAlias,
});

app.synth();