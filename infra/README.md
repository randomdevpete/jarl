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
| `JarlSsrStack` | EC2 instance running the docs SSR server, which the distribution reaches directly as a second origin |
| `JarlDomainStack` | Route53 hosted zone for the domain, and the ACM certificate CloudFront serves it under |

`JarlStaticSiteStack` owns the single CloudFront distribution; the other two meet it there rather than
creating a front of their own. It exposes its `bucket` and `distribution` as public readonly members
for them to build on, and exports `JarlSiteBucketName`, `JarlDistributionId` and
`JarlDistributionDomainName` for anything reaching them from outside the app. `JarlSsrStack` adds a
`/ssr/*` behaviour pointing at its own origin while every other path keeps hitting S3;
`JarlDomainStack` hands over the hosted zone and the certificate the distribution is created with.

> **Mid-cutover: the `/ssr/*` behaviour is deliberately absent.** CloudFront refuses to update a VPC
> origin that a distribution is still associated with, so detaching the behaviour and repointing the
> origin cannot happen in one deploy. Until the next deploy restores it, `/ssr/*` falls through to the
> distribution's static 404, and `JarlSsr` deploys *after* `JarlStaticSite`, inverting the order below.

`JarlStaticSite` therefore deploys last, whichever way the wiring runs: its template references
`JarlSsr`'s origin and `JarlDomain`'s certificate, so CloudFormation needs both in place before it can
be created or updated. `cdk deploy --all` works this out from the templates; deploying stacks one at a
time does not.

The alias records break that pattern. `jarl.randomdev.co.uk`'s A and AAAA records are created in
`JarlStaticSiteStack`, not `JarlDomainStack`, because they need the distribution and the distribution
needs `JarlDomainStack`'s certificate — owning both ends in the DNS stack would make the two stacks
depend on each other.

### Serving the docs build

The bucket is private — no public policy, no website endpoint. CloudFront reaches it through origin
access control, which is also why a missing key comes back as a 403 rather than a 404.

`packages/docs` prerenders one `<route>/index.html` per route, so requests arrive for paths S3 has no
object at: a viewer-request CloudFront Function appends `index.html` to any URI whose last segment is
empty or has no file extension. The site is a set of prerendered pages rather than a client-routed
app, so both 403 and 404 from the origin serve the build's own `404.html` **with a 404 status** — not
a rewrite to `index.html`.

Two cache behaviours: `/assets/*` holds Vite's content-hashed bundles and is cached for a year at the
edge and in the browser (`Cache-Control: public, max-age=31536000, immutable`, added by CloudFront
since the uploaded objects carry no headers of their own); everything else is HTML, cached five
minutes by default and an hour at most. Both compress.

### Serving server-rendered routes

`JarlSsrStack` adds a third behaviour, `/ssr/*`, to the same distribution — uncached
(`CACHING_DISABLED`), forwarding the whole viewer request (`ALL_VIEWER`), GET/HEAD/OPTIONS only. It is
the only path pattern that leaves S3, and no route `packages/docs` prerenders sits under it, so
adding it changes nothing about how the static site resolves. The directory-index rewrite is not
attached to it either, so the server sees the URI the viewer asked for. Two things it does inherit
from the distribution: requests arrive over HTTP/2 or HTTP/3 having been redirected to HTTPS at the
edge, and the custom error responses are distribution-wide, so a 404 or 403 from the server is served
as the static build's `404.html`.

`packages/docs` prerenders every route in `staticPaths` to a static file; `/ssr/*` exists for whatever
isn't, and nothing today matches it - the server behind it renders through the same `App` component
tree, so an unmatched path gets the same not-found page a prerendered route would.

The traffic path is `viewer → CloudFront → VPC origin → instance:3000`:

- **CloudFront reaches the instance directly**, as a
  [VPC origin](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-vpc-origins.html)
  rather than over the internet, addressing it by its private DNS name on port 3000. Creating one
  makes CloudFront attach a service-managed network interface to the origin's own subnet, carrying a
  security group it creates and owns, `CloudFront-VPCOrigins-Service-SG`.
- **The instance takes no inbound traffic at all** beyond port 3000 from that security group. There
  is no key pair and no port 22: shell access is
  `aws ssm start-session --target <JarlSsrInstanceId>`, which is what the instance role's
  `AmazonSSMManagedInstanceCore` is for.
- **That ingress rule names the security group, not an address range**, and the two are not
  interchangeable here. A VPC-CIDR rule does not match at all — the interface holds a private
  address, but the origin sees a CloudFront one. A rule against the
  `com.amazonaws.global.cloudfront.origin-facing` prefix list would match, but the instance holds a
  public IPv4 address, so it would admit that address from the internet as well. Only a
  security-group source is unreachable from outside the VPC. Its id is not an attribute of the VPC
  origin, so the stack looks the group up by name at deploy time, in a custom resource, which is what
  keeps `cdk synth` free of credentials.
- **On an account that has never had a VPC origin, the first deploy fails.** The group does not exist
  until CloudFront has made one, so the lookup finds nothing and the deploy stops at
  `SsrOriginSecurityGroupLookup`, naming the group it could not find. **No recovery from that is
  established here**, and it is worse than a retry: the failed create rolls the whole stack back,
  the VPC with it, and `DeleteVpc` fails with `DependencyViolation` while CloudFront's group and
  interfaces are still inside — which they are, because CloudFront removes them asynchronously. The
  realistic outcome is a stack wedged in `ROLLBACK_FAILED` needing manual cleanup, not a second
  `cdk deploy` that works. An account that already has a VPC origin is unaffected.
- **A lookup that fails on an update wedges the rollback as well.** Re-running the lookup whenever the
  VPC origin is replaced is the point of it, but it means the lookup can fail on an update too, if the
  group has genuinely gone by then. CloudFormation rolls that update back by re-sending the previous
  properties, which fail identically, leaving `UPDATE_ROLLBACK_FAILED` — recoverable only with
  `aws cloudformation continue-update-rollback --resources-to-skip`.
- **It sits in a public subnet**, because it needs outbound access for `dnf`, npm and the SSM agent,
  and a NAT gateway costs more per month than the `t4g.small` it would serve. The internet gateway
  that buys is separately a prerequisite of VPC origins, which require one on the VPC without
  routing any origin traffic through it.
- **The isolated subnets carry nothing.** CloudFront places its network interface in the origin's own
  subnet, which is the public one. Deleting them is left to a follow-up: the interfaces CloudFront
  removes asynchronously would race it.
- **No API Gateway.** As a front for an EC2 origin it would need either a VPC link to a load
  balancer, which is a resource this deliberately does without, or a public HTTP proxy integration,
  which means exposing the instance.

Deploying a server bundle means putting it in `/opt/jarl-ssr` (entry point `server.mjs`, listening on
`$PORT`) and starting the unit:

```bash
sudo systemctl restart jarl-ssr
```

It must answer `GET /healthz`, which the roll below polls on the instance before it reports success.

Nothing health-checks the instance between rolls. CloudFront has no origin health check, so an
unreachable instance costs three connection attempts and then a 504; the origin's connection timeout
is 2 seconds rather than the default 10, which makes that 6 seconds of viewer wait rather than 30.
`/ssr/*` is uncached and 502/504 are not mapped to a custom error response, so the path recovers as
soon as the server does instead of serving a cached error.

**The origin's address is not stable across instance replacement.** CloudFront addresses the origin by
the instance's private DNS name, which `JarlSsrStack` supplies and the distribution in
`JarlStaticSiteStack` holds. `MachineImage.latestAmazonLinux2023()` re-resolves the AMI on every
deploy, so a new AMI replaces the instance and changes that name, and `/ssr/*` points at an instance
that no longer exists until `JarlStaticSite` deploys too and its new configuration propagates.
`cdk deploy --all` does both in order and closes the gap by itself; deploying `JarlSsr` alone does not.
A load balancer in front would not have this gap: its DNS name survives instance replacement, and its
target group registers the replacement itself. **This is the cost of doing without one that applies at
exactly one instance** — unlike health-check draining and round-robin, which need more than one to
matter at all. Nothing here mitigates it: pinning the AMI, and always deploying the two stacks
together, are the obvious routes and neither is taken.

Neither value the distribution takes from `JarlSsrStack` — the origin's domain name and the VPC origin
id — crosses as a CloudFormation export. `cdk.json` sets `@aws-cdk/core:defaultCrossStackReferences` to
`weak`, so the CDK CLI resolves both from the other stack's outputs at deploy time instead. Nothing
therefore refuses to remove them while they are in use: `cdk destroy JarlSsr` succeeds and leaves
`JarlStaticSite` routing `/ssr/*` at an origin that has gone, where an `Fn::ImportValue` would have
refused. It also means only the CDK CLI can deploy these stacks; a raw CloudFormation update is
rejected, because the template holds an intrinsic CloudFormation cannot parse.

### Rolling the SSR server

`scripts/build.mjs` builds `packages/docs/dist-ssr/` alongside the static `dist/` - `server.mjs` (a
plain Node HTTP server: `GET /healthz`, everything under `/ssr` rendered through `entry-server.tsx`'s
`render`) and `template.html` (the same hashed-asset template every prerendered route fills). The
`deploy` job in `.github/workflows/ci.yml` tars that directory, uploads it to `SsrBundleBucket`
(`JarlSsrBundleBucketName` output), then runs an `AWS-RunShellScript` document on the instance over
SSM Run Command that downloads and extracts it into `/opt/jarl-ssr` and restarts `jarl-ssr` - no SSH,
using only the instance's existing `AmazonSSMManagedInstanceCore` access. The job polls
`https://jarl.randomdev.co.uk/ssr/` for a 200 afterwards and fails loudly if the roll didn't take.

### Domain and certificate

`jarl.randomdev.co.uk` gets its own Route53 public hosted zone, created by the stack rather than
looked up: `HostedZone.fromLookup` reads the account at synth time, and synth here has to work with no
credentials. The certificate covers that one name, is issued in `us-east-1`, and is validated by DNS
into the new zone. The distribution is created with the name as an alternate domain name and that
certificate as its viewer certificate; two apex records, A and AAAA, alias it.

**The parent domain is registered elsewhere.** `randomdev.co.uk` is at GoDaddy, so nothing in this app
can delegate the subdomain to Route53 — that is a manual step at the registrar, using the name servers
Route53 assigns the new zone. The `JarlZoneNameServers` output carries them, `JarlHostedZoneId` and
`JarlSiteCertificateArn` the other two identifiers worth having to hand.

**The first deploy waits for that delegation, so do it in two passes.** CloudFormation writes ACM's
validation record into the hosted zone and then blocks on the certificate until ACM can resolve it
over public DNS, which cannot happen until the parent delegates. Deploy the domain stack on its own
first:

```bash
npx cdk deploy JarlDomain
```

It creates the zone immediately and then sits on the certificate. While it waits, read the name
servers straight off the zone — the `JarlZoneNameServers` output only becomes readable once the stack
finishes, which is after the thing it is needed for:

```bash
aws route53 list-resource-record-sets --hosted-zone-id "$(aws route53 list-hosted-zones-by-name \
  --dns-name jarl.randomdev.co.uk --query 'HostedZones[0].Id' --output text)" \
  --query "ResourceRecordSets[?Type=='NS'].ResourceRecords[].Value" --output text
```

Enter those as the NS records for the `jarl` subdomain at GoDaddy. ACM validates within minutes of the
delegation propagating and the stack completes; `npm run deploy` then brings up the other two. Do the
delegation while the deploy is waiting rather than after it — CloudFormation eventually gives up and
rolls the stack back, taking the zone (and the name servers just delegated to) with it.

Later deploys never pause here: the zone, its delegation and the issued certificate all persist, and
ACM renews automatically through the validation record left in the zone.

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

On a fresh account `deploy` is not the first thing to run: see the two-pass first deploy under
[Domain and certificate](#domain-and-certificate).

CI runs the same thing: the `deploy` job in `.github/workflows/ci.yml` assumes the GitHub OIDC
deploy role (`AWS_DEPLOY_ROLE_ARN` repo variable) on every master push after the test jobs pass,
then `cdk deploy --all` and the content publish below.

## Publishing site content

`cdk deploy` provisions an empty bucket. Content is uploaded separately rather than through a CDK
`BucketDeployment`, so a synth never depends on the docs site having been built:

```bash
npm run build --workspace packages/docs
aws s3 sync packages/docs/dist "s3://$(aws cloudformation describe-stacks \
  --stack-name JarlStaticSite --query 'Stacks[0].Outputs[?ExportName==`JarlSiteBucketName`].OutputValue' \
  --output text)" --delete
aws cloudfront create-invalidation --distribution-id <JarlDistributionId> --paths '/*'
```

Run both steps: `--delete` retires pages dropped from the build, and the invalidation is what makes
new HTML visible before the five-minute page TTL expires.

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
