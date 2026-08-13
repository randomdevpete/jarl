import { Stack } from "aws-cdk-lib";

export const siteDomainName = "jarl.randomdev.co.uk";

/** Region for regional resources: London, nearest the site's audience. */
export const primaryRegion = "eu-west-2";

/** CloudFront only accepts ACM certificates issued in us-east-1. */
export const certificateRegion = "us-east-1";

/** Private S3 bucket for the `packages/docs` build, fronted by the CloudFront distribution the other two stacks attach to. */
export class JarlStaticSiteStack extends Stack {}

/** EC2 instance running the docs SSR server, attached to the distribution as a second origin. */
export class JarlSsrStack extends Stack {}

/** Route53 hosted zone for {@link siteDomainName} and the certificate CloudFront serves it under. */
export class JarlDomainStack extends Stack {}
