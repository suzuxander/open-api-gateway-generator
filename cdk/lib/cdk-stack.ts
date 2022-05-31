import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnApi, CfnFunction } from 'aws-cdk-lib/aws-sam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { CfnRole } from 'aws-cdk-lib/aws-iam';

export class CdkStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
  }

  public api = (id: string, options: {
    name: string,
    stageName: string,
    definitionUri: string
  }): CfnApi => {
    const {
      name, stageName, definitionUri
    } = options;
    return new CfnApi(this, id, {
      stageName,
      name,
      definitionUri,
    });
  };

  public lambdaFunction = (id: string, options: {
    codeUri: string,
    handler: string,
    role: string,
    runtime: Runtime,
    functionName?: string,
    layers?: string[],
    timeout?: number,
    memorySize?: number,
    event?: { api?: { method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, restApiId: string } }
  }) => {
    const {
      codeUri,
      handler,
      role,
      functionName,
      layers,
      runtime,
      timeout,
      memorySize,
      event
    } = options;

    let _event: any = {};
    if (event && event.api) {
      const { method, path, restApiId } = event.api;
      _event['api'] = {
        type: 'Api',
        properties: {
          method,
          path,
          restApiId
        }
      }
    }

    return new CfnFunction(this, id, {
      codeUri,
      handler,
      role,
      functionName,
      layers,
      runtime: runtime.toString(),
      timeout,
      memorySize,
      events: _event
    })
  };

  public serviceRole = (id: string, options: {
    roleName: string,
    assumeRolePolicy: { service: string[] },
    policy?: { name?: string, statement: { effect: 'Allow' | 'Deny', action: string[], resource: string[] }[] },
  }): CfnRole => {
    const {
      roleName,
      assumeRolePolicy,
      policy,
    } = options;

    let policies: any[] = [];
    if (policy) {
      policies = [{
        policyName: policy.name ?? 'policy',
        policyDocument: {
          Statement: policy.statement.map(st => (
            {
              Action: st.action,
              Effect: st.effect,
              Resource: st.resource
            }
          )),
          Version: '2012-10-17'
        }
      }];
    }

    return new CfnRole(this, id, {
      roleName,
      assumeRolePolicyDocument: {
        Statement: [{
          Action: [ 'sts:AssumeRole' ],
          Effect: 'Allow',
          Principal: {
            Service: assumeRolePolicy.service
          }
        }],
        Version: '2012-10-17'
      },
      policies
    });
  };
}
