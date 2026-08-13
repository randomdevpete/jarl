# Infrastructure

AWS CDK app provisioning the hosting for <https://jarl.randomdev.co.uk> — the `packages/docs` site,
served as static assets from S3 through CloudFront, with an EC2 origin for server-rendered routes.

`infra/` is a standalone npm project, deliberately absent from the root `workspaces` list, so nothing
here is installed, built, or published alongside `jarl-atoms` and `jarl-react`. Install it on its own:

```bash
npm install --prefix infra
```

## Stacks

All three are declared in [`lib/jarl-stacks.ts`](./lib/jarl-stacks.ts) and instantiated in
[`bin/jarl-infra.ts`](./bin/jarl-infra.ts).

| stack | holds |
| --- | --- |
| `JarlStaticSiteStack` | private S3 bucket for the docs build, and the CloudFront distribution fronting the site |
| `JarlSsrStack` | EC2 instance running the docs SSR server, attached to the distribution as a second origin |
| `JarlDomainStack` | Route53 hosted zone for the domain, and the ACM certificate CloudFront serves it under |

`JarlStaticSiteStack` owns the single CloudFront distribution; the other two attach to it rather than
creating their own. `JarlSsrStack` adds a cache behaviour routing dynamic paths to its instance while
static paths keep hitting S3, and `JarlDomainStack` supplies the alias records and the certificate.
Build them in that order — the two dependants both need the distribution to exist first.

## Accounts and regions

One AWS account, one environment. There is no staging/production split, and no account ID is
committed anywhere: the CDK CLI resolves the account from ambient credentials (`AWS_PROFILE`,
`AWS_ACCESS_KEY_ID`, or an SSO session). With no credentials at all the account is simply unset,
which is enough to synthesize but not to deploy.

Regions are fixed in `lib/jarl-stacks.ts`:

- `eu-west-2` (London) for regional resources, nearest the site's audience.
- `us-east-1` for `JarlDomainStack`, because CloudFront only accepts ACM certificates issued there.
  Route53 is global, so the hosted zone rides along in the same stack.

Spanning two regions is why every stack is created with `crossRegionReferences: true` — without it
the eu-west-2 distribution cannot reference the us-east-1 certificate.

Every resource is tagged `Project=jarl` and `Site=jarl.randomdev.co.uk` for cost attribution.

## Bootstrap

Each account/region pair needs bootstrapping once before its first deploy, and both regions above
count separately:

```bash
npx cdk bootstrap aws://<account-id>/eu-west-2 aws://<account-id>/us-east-1
```

## Commands

Run from `infra/`:

```bash
npm run synth       # synthesize CloudFormation templates into cdk.out (no credentials needed)
npm run diff        # compare the synthesized stacks against what is deployed
npm run deploy      # deploy all three stacks
npm run destroy     # tear them all down
npm run typecheck   # tsc over bin/ and lib/
```

Deploying from CI is not wired up yet; the `deploy` job in `.github/workflows/ci.yml` is still a
disabled placeholder.

## Checks

Lint and formatting come from the repo root, which runs `oxlint .` and `oxfmt .` across the whole
tree — `infra/` included, so there is nothing to configure here.

Typechecking is the exception. The root `npm run typecheck` covers only the workspace packages and
`scripts/`, because this is Node-targeted code with no DOM and its own compiler settings; it has its
own `tsconfig.json` and its own `typecheck` script, exactly as `e2e/` does.

The CDK app is executed straight from TypeScript by Node's built-in type stripping (`cdk.json` runs
`node bin/jarl-infra.ts`), so there is no build step and no separate TypeScript runner to install.
That is what `erasableSyntaxOnly` and `verbatimModuleSyntax` in `tsconfig.json` enforce, and why
relative imports carry an explicit `.ts` extension.
