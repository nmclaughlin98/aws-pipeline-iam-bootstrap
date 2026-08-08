import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { PipelineBootstrapConfig } from './config';

export interface PipelineIamStackProps extends cdk.StackProps {
    config: PipelineBootstrapConfig;
}

export class PipelineIamStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: PipelineIamStackProps) {
        super(scope, id, props);

        const { config } = props;

        // 1. Create or reference GitHub OIDC Provider
        const githubProvider = new iam.OpenIdConnectProvider(this, 'GitHubOidcProvider', {
            url: 'https://token.actions.githubusercontent.com',
            clientIds: ['sts.amazonaws.com'],
        });

        // 2. Provision OIDC deployment roles for each allowed GitHub repository
        config.allowedRepositories.forEach((repoConfig) => {
            const sanitizedRepoName = repoConfig.repo.replace(/[^a-zA-Z0-9]/g, '-');
            const roleId = `DeployRole-${sanitizedRepoName}`;
            const roleName = repoConfig.roleName || `gh-deploy-${sanitizedRepoName}`;
            const repoNameOnly = repoConfig.repo.split('/')[1];

            const deployRole = new iam.Role(this, roleId, {
                roleName,
                description: `Deployment role for GitHub Actions pipeline in repo ${repoConfig.repo}`,
                assumedBy: new iam.OpenIdConnectPrincipal(githubProvider, {
                    StringEquals: {
                        'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                    },
                    StringLike: {
                        'token.actions.githubusercontent.com:sub': [
                            // Classic format (older repos / fallback)
                            `repo:${repoConfig.repo}:*`,
                            // Immutable format (repos created on/after ~15 July 2026)
                            `repo:nmclaughlin98@${repoConfig.ownerId}/${repoNameOnly}@${repoConfig.repoId}:*`,
                        ],
                    },
                }),
            });

            // 3. Grant permission to assume CDK bootstrap roles
            deployRole.addToPolicy(
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['sts:AssumeRole'],
                    resources: [`arn:aws:iam::${this.account}:role/cdk-hnb659fds-*`],
                })
            );

            // 4. Grant permission to read CDK SSM version parameter
            deployRole.addToPolicy(
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: ['ssm:GetParameter'],
                    resources: [
                        `arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/hnb659fds/*`,
                    ],
                })
            );

            // Output Role ARN
            new cdk.CfnOutput(this, `RoleArn-${sanitizedRepoName}`, {
                value: deployRole.roleArn,
                description: `Deployment Role ARN for ${repoConfig.repo}`,
            });
        });

        // 5. Also configure policy for legacy/static IAM deployment user
        const deployUser = iam.User.fromUserName(this, 'DeployUser', 'testion-retail-deployment-user');
        deployUser.addToPrincipalPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['sts:AssumeRole'],
                resources: [`arn:aws:iam::${this.account}:role/cdk-hnb659fds-*`],
            })
        );
        deployUser.addToPrincipalPolicy(
            new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['ssm:GetParameter'],
                resources: [
                    `arn:aws:ssm:${this.region}:${this.account}:parameter/cdk-bootstrap/hnb659fds/*`,
                ],
            })
        );
    }
}