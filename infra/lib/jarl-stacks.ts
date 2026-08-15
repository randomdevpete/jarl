import { CfnOutput, Duration, Fn, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import { Certificate, CertificateValidation, type ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  Function as CloudFrontFunction,
  FunctionCode,
  FunctionEventType,
  HttpVersion,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
  VpcOrigin as VpcOriginResource,
  VpcOriginEndpoint,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin, VpcOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  AmazonLinuxCpuType,
  BlockDeviceVolume,
  EbsDeviceVolumeType,
  Instance,
  InstanceClass,
  InstanceSize,
  InstanceType,
  IpAddresses,
  MachineImage,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { ApplicationLoadBalancer, ApplicationProtocol } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { InstanceTarget } from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import { ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { ARecord, AaaaRecord, type IHostedZone, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export const siteDomainName = "jarl.randomdev.co.uk";

/** Region for regional resources: London, nearest the site's audience. */
export const primaryRegion = "eu-west-2";

/** CloudFront only accepts ACM certificates issued in us-east-1. */
export const certificateRegion = "us-east-1";

/** Vite writes content-hashed bundles here; a rebuild renames them, so they never need revalidating. */
const hashedAssetPathPattern = "/assets/*";
const hashedAssetLifetime = Duration.days(365);

/** The path `packages/docs`' build writes its not-found page to. */
const notFoundPagePath = "/404.html";

/**
 * Rewrites a prerendered route onto the object holding it: the docs build emits `<route>/index.html`
 * per path, and S3 has no directory-index behaviour of its own.
 */
const directoryIndexRewrite = `
function handler(event) {
  var request = event.request;
  var lastSegment = request.uri.slice(request.uri.lastIndexOf("/") + 1);
  if (lastSegment === "") {
    request.uri = request.uri + "index.html";
  } else if (lastSegment.indexOf(".") === -1) {
    request.uri = request.uri + "/index.html";
  }
  return request;
}
`;

export interface JarlStaticSiteStackProps extends StackProps {
  /** {@link JarlDomainStack.hostedZone} — the distribution's alias records are created in it. */
  readonly hostedZone: IHostedZone;
  /** {@link JarlDomainStack.certificate} — CloudFront rejects one issued outside {@link certificateRegion}. */
  readonly certificate: ICertificate;
}

/** Private S3 bucket for the `packages/docs` build, and the CloudFront distribution serving it at {@link siteDomainName}. */
export class JarlStaticSiteStack extends Stack {
  readonly bucket: Bucket;
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: JarlStaticSiteStackProps) {
    super(scope, id, props);

    this.bucket = new Bucket(this, "SiteBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Every object is reproducible from the docs build, so a teardown needn't preserve any.
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront signs its origin requests; the bucket policy grants s3:GetObject to this
    // distribution only, so the bucket itself stays fully private.
    const origin = S3BucketOrigin.withOriginAccessControl(this.bucket);

    const sharedBehaviour = {
      origin,
      compress: true,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
    };

    const pageCachePolicy = new CachePolicy(this, "PrerenderedPageCachePolicy", {
      minTtl: Duration.seconds(0),
      defaultTtl: Duration.minutes(5),
      maxTtl: Duration.hours(1),
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
    });

    const hashedAssetCachePolicy = new CachePolicy(this, "HashedAssetCachePolicy", {
      minTtl: hashedAssetLifetime,
      defaultTtl: hashedAssetLifetime,
      maxTtl: hashedAssetLifetime,
      enableAcceptEncodingBrotli: true,
      enableAcceptEncodingGzip: true,
    });

    // The uploaded objects carry no Cache-Control of their own, so browsers get theirs from here.
    const hashedAssetHeadersPolicy = new ResponseHeadersPolicy(this, "HashedAssetHeadersPolicy", {
      customHeadersBehavior: {
        customHeaders: [
          {
            header: "Cache-Control",
            value: `public, max-age=${hashedAssetLifetime.toSeconds()}, immutable`,
            override: true,
          },
        ],
      },
    });

    const directoryIndexFunction = new CloudFrontFunction(this, "DirectoryIndexFunction", {
      code: FunctionCode.fromInline(directoryIndexRewrite),
    });

    this.distribution = new Distribution(this, "SiteDistribution", {
      comment: siteDomainName,
      domainNames: [siteDomainName],
      certificate: props.certificate,
      defaultRootObject: "index.html",
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        ...sharedBehaviour,
        cachePolicy: pageCachePolicy,
        functionAssociations: [{ function: directoryIndexFunction, eventType: FunctionEventType.VIEWER_REQUEST }],
      },
      additionalBehaviors: {
        [hashedAssetPathPattern]: {
          ...sharedBehaviour,
          cachePolicy: hashedAssetCachePolicy,
          responseHeadersPolicy: hashedAssetHeadersPolicy,
        },
      },
      // Origin access control grants no s3:ListBucket, so a missing key comes back as 403 rather
      // than 404 — both need mapping to the real not-found page.
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 404,
        responsePagePath: notFoundPagePath,
        ttl: Duration.minutes(5),
      })),
    });

    // These live here rather than in JarlDomainStack: they need the distribution, which needs that
    // stack's certificate, so owning both ends there would make the two stacks depend on each other.
    const aliasTarget = RecordTarget.fromAlias(new CloudFrontTarget(this.distribution));
    new ARecord(this, "SiteAliasRecord", { zone: props.hostedZone, target: aliasTarget });
    new AaaaRecord(this, "SiteAliasRecordIpv6", { zone: props.hostedZone, target: aliasTarget });

    new CfnOutput(this, "SiteBucketName", {
      value: this.bucket.bucketName,
      description: "Upload target for the packages/docs build output",
      exportName: "JarlSiteBucketName",
    });

    new CfnOutput(this, "DistributionId", {
      value: this.distribution.distributionId,
      description: "Invalidate this after every upload",
      exportName: "JarlDistributionId",
    });

    new CfnOutput(this, "DistributionDomainName", {
      value: this.distribution.distributionDomainName,
      exportName: "JarlDistributionDomainName",
    });
  }
}

/** No route `packages/docs` prerenders sits under this pattern. */
const ssrPathPattern = "/ssr/*";

const ssrPort = 3000;
const ssrHealthCheckPath = "/healthz";
const ssrInstallDirectory = "/opt/jarl-ssr";
const ssrServiceName = "jarl-ssr";

/** Created out of band for the GitHub OIDC deploy job; not a CDK-managed role, only its incremental grants below are. */
const deployRoleName = "jarl-github-actions-deploy";

/** Installs the runtime and the service that runs the SSR server; a deploy is what starts it. */
const ssrInstanceSetup = `set -euo pipefail
dnf install -y nodejs22
install -d -o ec2-user -g ec2-user ${ssrInstallDirectory}
cat >/etc/systemd/system/${ssrServiceName}.service <<'UNIT'
[Unit]
Description=jarl docs SSR server
After=network-online.target

[Service]
User=ec2-user
WorkingDirectory=${ssrInstallDirectory}
Environment=NODE_ENV=production
Environment=PORT=${ssrPort}
# node-22, not node: AL2023 leaves that as an alternatives symlink onto whichever major is active.
ExecStart=/usr/bin/node-22 ${ssrInstallDirectory}/server.mjs
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
systemctl enable ${ssrServiceName}
`;

export interface JarlSsrStackProps extends StackProps {
  /** {@link JarlStaticSiteStack.distribution} — this stack adds its behaviour to it rather than creating a front. */
  readonly distribution: Distribution;
}

/** EC2 instance running the docs SSR server, attached to the distribution as a second origin. */
export class JarlSsrStack extends Stack {
  constructor(scope: Construct, id: string, props: JarlSsrStackProps) {
    super(scope, id, props);

    // Two AZs because a load balancer needs two, and no NAT gateway: one would cost more per month
    // than the instance it serves. The internet gateway is also a prerequisite of VPC origins.
    const vpc = new Vpc(this, "SsrVpc", {
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        { name: "Public", subnetType: SubnetType.PUBLIC, cidrMask: 24 },
        { name: "Isolated", subnetType: SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    const instanceRole = new Role(this, "SsrInstanceRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")],
    });

    // Holds the built server bundle between a deploy uploading it and the roll that fetches
    // it onto the instance. Reproducible from the docs build like SiteBucket, so nothing here
    // needs to survive a teardown.
    const bundleBucket = new Bucket(this, "SsrBundleBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    bundleBucket.grantRead(instanceRole);

    const instanceSecurityGroup = new SecurityGroup(this, "SsrInstanceSecurityGroup", {
      vpc,
      description: "jarl SSR server: load balancer ingress only",
    });

    const userData = UserData.forLinux();
    userData.addCommands(ssrInstanceSetup);

    // Public subnet only for outbound access (dnf, npm, SSM) — no key pair, no port 22; the only
    // ingress is the load balancer's rule below.
    const instance = new Instance(this, "SsrInstance", {
      vpc,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
      instanceType: InstanceType.of(InstanceClass.BURSTABLE4_GRAVITON, InstanceSize.SMALL),
      machineImage: MachineImage.latestAmazonLinux2023({ cpuType: AmazonLinuxCpuType.ARM_64 }),
      securityGroup: instanceSecurityGroup,
      role: instanceRole,
      userData,
      userDataCausesReplacement: true,
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: BlockDeviceVolume.ebs(20, {
            encrypted: true,
            volumeType: EbsDeviceVolumeType.GP3,
            deleteOnTermination: true,
          }),
        },
      ],
    });

    const loadBalancer = new ApplicationLoadBalancer(this, "SsrLoadBalancer", {
      vpc,
      internetFacing: false,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
    });

    // CloudFront's VPC-origin ENIs sit inside this VPC, so ingress is only as narrow as the CIDR;
    // the tighter CloudFront-managed prefix list needs a credentialed lookup, which synth must avoid.
    loadBalancer.connections.allowFrom(Peer.ipv4(vpc.vpcCidrBlock), Port.HTTP);

    // Registering an instance target wires no security group rules of its own.
    instance.connections.allowFrom(loadBalancer, Port.tcp(ssrPort));

    // `open` would put an 0.0.0.0/0 rule on the listener's port, undoing the rule above.
    const listener = loadBalancer.addListener("SsrListener", {
      protocol: ApplicationProtocol.HTTP,
      open: false,
    });

    listener.addTargets("SsrTarget", {
      port: ssrPort,
      protocol: ApplicationProtocol.HTTP,
      targets: [new InstanceTarget(instance, ssrPort)],
      deregistrationDelay: Duration.seconds(10),
      healthCheck: {
        path: ssrHealthCheckPath,
        interval: Duration.seconds(30),
        healthyThresholdCount: 2,
      },
    });

    // The load balancer terminates nothing, so CloudFront has to speak plain HTTP to it; the default
    // policy would follow the viewer onto port 443, where there is no listener.
    const vpcOrigin = new VpcOriginResource(this, "SsrVpcOrigin", {
      endpoint: VpcOriginEndpoint.applicationLoadBalancer(loadBalancer),
      protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
    });

    // JarlStaticSiteStack's errorResponses are distribution-wide: a 403/404 from the server still
    // serves the static build's 404.html, not anything from this origin.
    props.distribution.addBehavior(ssrPathPattern, VpcOrigin.withVpcOrigin(vpcOrigin), {
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      cachePolicy: CachePolicy.CACHING_DISABLED,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
      compress: true,
    });

    // The deploy role's baseline permissions (assume-cdk-roles, DescribeStacks, site-bucket S3,
    // CloudFront invalidation) were granted out of band alongside the role itself; this adds
    // only what rolling the SSR server needs, as its own policy on the same role.
    const deployRole = Role.fromRoleName(this, "GithubActionsDeployRole", deployRoleName);
    bundleBucket.grantPut(deployRole);
    deployRole.addToPrincipalPolicy(
      new PolicyStatement({
        sid: "RollSsrServer",
        actions: ["ssm:SendCommand"],
        resources: [
          Stack.of(this).formatArn({ service: "ec2", resource: "instance", resourceName: instance.instanceId }),
          Stack.of(this).formatArn({
            service: "ssm",
            account: "",
            resource: "document",
            resourceName: "AWS-RunShellScript",
          }),
        ],
      }),
    );
    deployRole.addToPrincipalPolicy(
      new PolicyStatement({
        sid: "ReadSsrRollResult",
        actions: ["ssm:GetCommandInvocation"],
        // Doesn't support resource-level permissions - the command ID isn't known until sent.
        resources: ["*"],
      }),
    );

    new CfnOutput(this, "SsrInstanceId", {
      value: instance.instanceId,
      description: `Deploy target: upload the server to ${ssrInstallDirectory}, then restart ${ssrServiceName}`,
      exportName: "JarlSsrInstanceId",
    });

    new CfnOutput(this, "SsrBundleBucketName", {
      value: bundleBucket.bucketName,
      description: "Upload target for the packages/docs SSR server bundle",
      exportName: "JarlSsrBundleBucketName",
    });

    new CfnOutput(this, "SsrPathPattern", {
      value: ssrPathPattern,
      description: "Distribution paths served by the SSR instance rather than S3",
      exportName: "JarlSsrPathPattern",
    });
  }
}

/** Route53 hosted zone for {@link siteDomainName} and the certificate CloudFront serves it under. */
export class JarlDomainStack extends Stack {
  readonly hostedZone: PublicHostedZone;
  readonly certificate: Certificate;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // Created rather than looked up: HostedZone.fromLookup reads the account, and synth must not.
    this.hostedZone = new PublicHostedZone(this, "SiteZone", { zoneName: siteDomainName });

    // CloudFormation writes the validation record into the zone and then waits on ACM, so this
    // resource blocks until randomdev.co.uk delegates to the name servers output below.
    this.certificate = new Certificate(this, "SiteCertificate", {
      domainName: siteDomainName,
      validation: CertificateValidation.fromDns(this.hostedZone),
    });

    new CfnOutput(this, "ZoneNameServers", {
      value: Fn.join(", ", this.hostedZone.hostedZoneNameServers ?? []),
      description: `Delegate ${siteDomainName} to these NS records at the randomdev.co.uk registrar`,
      exportName: "JarlZoneNameServers",
    });

    new CfnOutput(this, "HostedZoneId", {
      value: this.hostedZone.hostedZoneId,
      exportName: "JarlHostedZoneId",
    });

    new CfnOutput(this, "SiteCertificateArn", {
      value: this.certificate.certificateArn,
      exportName: "JarlSiteCertificateArn",
    });
  }
}
