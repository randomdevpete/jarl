import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from "aws-cdk-lib";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  Function as CloudFrontFunction,
  FunctionCode,
  FunctionEventType,
  HttpVersion,
  PriceClass,
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
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

/** Private S3 bucket for the `packages/docs` build, fronted by the CloudFront distribution the other two stacks attach to. */
export class JarlStaticSiteStack extends Stack {
  readonly bucket: Bucket;
  readonly distribution: Distribution;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.bucket = new Bucket(this, "SiteBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      // Every object is reproducible from the docs build, so a teardown needn't preserve any.
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Origin access control, so the bucket stays private: CloudFront signs its origin requests and
    // the only policy on the bucket grants s3:GetObject to this distribution.
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
      // The site is prerendered per route rather than client-routed, so an unknown path is a genuine
      // 404 and not an entry point. S3 answers a missing key with 403 under origin access control,
      // because the policy grants no s3:ListBucket.
      errorResponses: [403, 404].map((httpStatus) => ({
        httpStatus,
        responseHttpStatus: 404,
        responsePagePath: notFoundPagePath,
        ttl: Duration.minutes(5),
      })),
    });

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

/** EC2 instance running the docs SSR server, attached to the distribution as a second origin. */
export class JarlSsrStack extends Stack {}

/** Route53 hosted zone for {@link siteDomainName} and the certificate CloudFront serves it under. */
export class JarlDomainStack extends Stack {}
