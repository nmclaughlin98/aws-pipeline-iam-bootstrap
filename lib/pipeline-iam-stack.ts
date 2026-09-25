import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import {
    DeployPermission,
    PipelineBootstrapConfig,
    RepositoryConfig,
    StaticUserConfig,
} from './config';

export interface PipelineIamStackProps extends cdk.StackProps {
    config: PipelineBootstrapConfig;
}

export class PipelineIamStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PipelineIamStackProps) {
        super(scope, id, props);

        const { config } = props;

        const githubProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
            url: 'https://token.actions.githubusercontent.com',
            clientIds: ['sts.amazonaws.com'],
        });

        config.allowedRepositories.forEach((repoConfig) => {
            const sanitizedRepoName = repoConfig.repo.replace(/[^a-zA-Z0-9]/g, '-');
            const roleName = repoConfig.roleName;
            const [ownerName, repoNameOnly] = repoConfig.repo.split('/');

            const deployRole = new iam.Role(this, `DeployRole-${sanitizedRepoName}`, {
                roleName,
                description: `GitHub Actions deploy role for ${repoConfig.repo}`,
                assumedBy: new iam.OpenIdConnectPrincipal(githubProvider, {
                    StringEquals: {
                        'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                    },
                    StringLike: {
                        'token.actions.githubusercontent.com:sub': [
                            `repo:${repoConfig.repo}:*`,
                            `repo:${ownerName}@${repoConfig.ownerId}/${repoNameOnly}@${repoConfig.repoId}:*`,
                        ],
                    },
                }),
            });

            this.grantPermissions(deployRole, repoConfig.permissions, repoConfig.seedTables);

            new cdk.CfnOutput(this, `RoleArn-${sanitizedRepoName}`, {
                value: deployRole.roleArn,
                description: `Deployment role ARN for ${repoConfig.repo}`,
            });
        });

        (config.staticUsers ?? []).forEach((userConfig) => {
            const user = iam.User.fromUserName(this, `User-${userConfig.userName}`, userConfig.userName);
            this.grantPermissions(user, userConfig.permissions, userConfig.seedTables);
        });
    }

    private grantPermissions(
        principal: iam.IPrincipal,
        permissions: DeployPermission[],
        seedTables?: string[]
    ): void {
        if (permissions.includes('cdk-deploy')) {
            principal.addToPrincipalPolicy(
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['sts:AssumeRole'],
                    resources: [`arn:aws:iam::${this.account}:role/cdk-hnb659fds-*`],
                })
            );
            principal.addToPrincipalPolicy(
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ssm:GetParameter'],
                    resources: [
                        `arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/hnb659fds/*`,
                    ],
                })
            );
        }

        if (permissions.includes('dynamodb-seed')) {
            const tables = seedTables ?? [];
            if (tables.length === 0) {
                throw new Error('dynamodb-seed requires at least one table in seedTables');
            }

            const tableArns = tables.flatMap((tableName) => [
                `arn:aws:dynamodb:${this.region}:${this.account}:table/${tableName}`,
                `arn:aws:dynamodb:${this.region}:${this.account}:table/${tableName}/index/*`,
            ]);

            principal.addToPrincipalPolicy(
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: [
                        'dynamodb:BatchWriteItem',
                        'dynamodb:PutItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:DescribeTable',
                    ],
                    resources: tableArns,
                })
            );
        }
    }
}