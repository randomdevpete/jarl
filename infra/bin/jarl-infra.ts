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

const staticSite = new JarlStaticSiteStack(app, "JarlStaticSite", stackPropsIn(primaryRegion));
// Instantiation order is this way round for the prop below; CloudFormation's deploy order is the
// reverse, since JarlStaticSite's template ends up referencing JarlSsr's origin.
new JarlSsrStack(app, "JarlSsr", { ...stackPropsIn(primaryRegion), distribution: staticSite.distribution });
new JarlDomainStack(app, "JarlDomain", stackPropsIn(certificateRegion));
