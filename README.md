# AWS Pipeline IAM Bootstrap

Central CDK stack that creates GitHub Actions OIDC deploy roles for backend repositories.

## Purpose

This repository decouples CI/CD deployment permissions from application stacks. It provides keyless GitHub Actions
authentication with short-lived AWS credentials and avoids the chicken-and-egg problem of an application stack
managing its own deployment permissions.

## Add a repository or stack

No bootstrap configuration change is needed for a new repository or CDK stack under `nmclaughlin98`. Configure the
repository's GitHub Actions workflow to assume the `SharedGitHubDeployRoleArn` output from this CDK stack.

```yaml
- name: Configure AWS Credentials
  uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-region: eu-west-2
    role-to-assume: arn:aws:iam::<AWS_ACCOUNT_ID>:role/github-actions-deploy-role
```

The shared role trusts all repositories under the configured GitHub owner, including repositories created in the future.
It has the permissions and DynamoDB seed-table access configured in `sharedGitHubRole` in [`lib/config.ts`](lib/config.ts).
Every trusted repository shares those permissions; in particular, every one can seed every table in `seedTables`.
A new CDK stack in a trusted repository also needs no separate IAM entry.

### Migrate existing repositories

Existing per-repository roles remain configured in `allowedRepositories` during migration:

1. Deploy this bootstrap stack to create the shared role.
2. Update each existing repository's workflow to use the shared role ARN.
3. After verifying all workflows use the shared role, remove the old entries from `allowedRepositories` and deploy again.

## GitHub Actions requirements

Each workflow needs `id-token: write` to request an OIDC token and `contents: read` to check out its repository:

```yaml
permissions:
  id-token: write
  contents: read
```

The workflow should then configure AWS credentials with `aws-actions/configure-aws-credentials` and deploy as usual:

```yaml
- name: Deploy CDK Stack
  run: npx cdk deploy --require-approval never
```

## Project structure

```text
aws-pipeline-iam-bootstrap/
├── bin/
│   └── app.ts                   # CDK application entrypoint
├── lib/
│   ├── config.ts                # Shared and legacy GitHub role configuration
│   └── pipeline-iam-stack.ts    # OIDC provider and deployment roles
├── cdk.json
├── package.json
└── README.md
```
