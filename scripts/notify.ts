import path from "path";
// discord.js v11 predates that project's own TypeScript rewrite and has no
// upstream type declarations (no `@types/discord.js` package exists for it
// either) - typed as `any` at this boundary rather than hand-rolling a partial
// declaration file for a dependency this old.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Discord: any = require("discord.js");

const client = new Discord.WebhookClient(process.env.DISCORD_WEBHOOK_ID, process.env.DISCORD_WEBHOOK_TOKEN);

const notifyDiscord = (message: string, file?: string | null) =>
  client.send(message, file ? new Discord.Attachment(file) : null);

const findCypressScreenshot = (): string => path.resolve(__dirname, "../demo/cypress/screenshots/HomePage.png");

const createMessage = async (type: string): Promise<void> => {
  const {
    CIRCLE_COMMIT: commit,
    CIRCLE_BUILD_NUM: buildNum,
    CIRCLE_BUILD_URL: buildUrl,
    CIRCLE_PULL_REQUEST: pr,
    JARL_VERSION: version,
  } = process.env;
  const prefix = `[#${buildNum}](${buildUrl}):`;
  switch (type) {
    case "staging": {
      const filePath = findCypressScreenshot();
      const stagingUrl = process.env.NOW_DEPLOY;
      notifyDiscord(`${prefix} Deployed demo to staging URL ${stagingUrl} from ${commit}`, filePath);
      break;
    }
    case "build": {
      if (pr) {
        notifyDiscord(`${prefix} Pull request ${pr}`);
      } else if (version) {
        notifyDiscord(`${prefix} Building version ${version}`);
      } else {
        notifyDiscord(`${prefix} Building demos for deployment to staging`);
      }
      break;
    }
    case "published":
      notifyDiscord(`${prefix} Published ${version} to npm registry: <https://www.npmjs.com/package/jarl-react>`);
      break;
    case "deployed": {
      const filePath = findCypressScreenshot();
      notifyDiscord(`${prefix} Deployed ${version} to http://jarl.downplay.co`, filePath);
      break;
    }
    default:
      throw new Error("Unknown notification type");
  }
};

const [, , type] = process.argv;

/* eslint-disable no-console */
createMessage(type)
  .then(() => {
    console.log("Sent");
  })
  .catch((e) => {
    console.error(e);
  });
