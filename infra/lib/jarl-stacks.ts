import { CfnOutput, CustomResource, Duration, Fn, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
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
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
  VpcOrigin as VpcOriginResource,
  VpcOriginEndpoint,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
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
  Port,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { ManagedPolicy, PolicyStatement, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Code, Function as LambdaFunction, determineLatestNodeRuntime } from "aws-cdk-lib/aws-lambda";
import { ARecord, AaaaRecord, type IHostedZone, PublicHostedZone, RecordTarget } from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { Provider } from "aws-cdk-lib/custom-resources";
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
const ssrInstallDirectory = "/opt/jarl-ssr";
const ssrServiceName = "jarl-ssr";

/** Created by CloudFront with its first VPC origin, and carried by the interfaces it routes origin traffic through. */
const cloudFrontOriginSecurityGroupName = "CloudFront-VPCOrigins-Service-SG";

/** Resolves {@link cloudFrontOriginSecurityGroupName} in the SSR VPC, failing by name when it is not there. */
const originSecurityGroupLookupHandler = `
const { EC2Client, DescribeSecurityGroupsCommand } = require("@aws-sdk/client-ec2");

exports.handler = async (event) => {
  if (event.RequestType === "Delete") {
    return {};
  }
  const { VpcId, GroupName } = event.ResourceProperties;
  const { SecurityGroups } = await new EC2Client({}).send(
    new DescribeSecurityGroupsCommand({
      Filters: [
        { Name: "vpc-id", Values: [VpcId] },
        { Name: "group-name", Values: [GroupName] },
      ],
    }),
  );
  const groupId = SecurityGroups?.[0]?.GroupId;
  if (!groupId) {
    throw new Error(
      \`No security group \${GroupName} in \${VpcId}. CloudFront creates it with an account's first VPC origin; the SSR instance has no ingress source without it.\`,
    );
  }
  return { PhysicalResourceId: groupId, Data: { GroupId: groupId } };
};
`;

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

/** EC2 instance running the docs SSR server, and the CloudFront VPC origin that reaches it. */
export class JarlSsrStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    // No NAT gateway: one would cost more per month than the instance it serves, so outbound
    // access runs through the public subnet's internet gateway, which VPC origins require anyway.
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
      description: "jarl SSR server: CloudFront VPC origin ingress only",
    });

    const userData = UserData.forLinux();
    userData.addCommands(ssrInstanceSetup);

    // Public subnet only for outbound access (dnf, npm, SSM) — no key pair, no port 22; the only
    // ingress is the VPC origin's rule below.
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

    // The server terminates nothing, so CloudFront has to speak plain HTTP to it; the default
    // policy would follow the viewer onto port 443, where nothing listens.
    // No distribution behaviour points here yet: CloudFront refuses to update a VPC origin while a
    // distribution is associated with it, so attaching this one is a deploy of its own.
    const vpcOrigin = new VpcOriginResource(this, "SsrVpcOrigin", {
      endpoint: VpcOriginEndpoint.ec2Instance(instance),
      httpPort: ssrPort,
      protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
    });

    // CloudFront's origin security group is nowhere among the VPC origin's attributes; only its name is known.
    const originSecurityGroupLookupFunction = new LambdaFunction(this, "SsrOriginSecurityGroupLookupFunction", {
      runtime: determineLatestNodeRuntime(this),
      handler: "index.handler",
      code: Code.fromInline(originSecurityGroupLookupHandler),
      timeout: Duration.seconds(30),
      // DescribeSecurityGroups takes no resource-level permissions, so the region condition is the
      // only narrowing available.
      initialPolicy: [
        new PolicyStatement({
          actions: ["ec2:DescribeSecurityGroups"],
          resources: ["*"],
          conditions: { StringEquals: { "aws:RequestedRegion": this.region } },
        }),
      ],
    });

    // The handler ignores VpcOriginId: it is here to order the lookup after the origin and to re-run
    // it whenever that origin is replaced.
    const originSecurityGroupLookup = new CustomResource(this, "SsrOriginSecurityGroupLookup", {
      serviceToken: new Provider(this, "SsrOriginSecurityGroupLookupProvider", {
        onEventHandler: originSecurityGroupLookupFunction,
      }).serviceToken,
      properties: {
        VpcId: vpc.vpcId,
        GroupName: cloudFrontOriginSecurityGroupName,
        VpcOriginId: vpcOrigin.vpcOriginId,
      },
    });

    // An address-range source would also admit the instance's own public address from the internet.
    instance.connections.allowFrom(
      SecurityGroup.fromSecurityGroupId(
        this,
        "SsrOriginSecurityGroup",
        originSecurityGroupLookup.getAttString("GroupId"),
        {
          mutable: false,
        },
      ),
      Port.tcp(ssrPort),
    );

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
