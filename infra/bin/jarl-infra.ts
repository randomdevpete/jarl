#!/usr/bin/env node
import { App, Tags } from "aws-cdk-lib";
import {
  certificateRegion,
  JarlDomainStack,
  JarlSsrStack,
  JarlStaticSiteStack,
  primaryRegion,
  siteDomainName,
} from "../lib/jarl-stacks.ts";

const app = new App();

Tags.of(app).add("Project", "jarl");
Tags.of(app).add("Site", siteDomainName);

// Unset until the CLI resolves credentials, which deploy needs and synth does not.
const account = process.env.CDK_DEFAULT_ACCOUNT;

// The certificate is pinned to another region, so every stack has to export across one.
const stackPropsIn = (region: string) => ({ env: { account, region }, crossRegionReferences: true });

const domain = new JarlDomainStack(app, "JarlDomain", stackPropsIn(certificateRegion));

const staticSite = new JarlStaticSiteStack(app, "JarlStaticSite", {
  ...stackPropsIn(primaryRegion),
  hostedZone: domain.hostedZone,
  certificate: domain.certificate,
});

const ssr = new JarlSsrStack(app, "JarlSsr", stackPropsIn(primaryRegion));

// The distribution has to let go of the VPC origin before CloudFront will let this stack update it.
ssr.addDependency(staticSite);
