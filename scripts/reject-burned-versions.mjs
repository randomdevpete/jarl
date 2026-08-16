// npm reserves a version number permanently on first publish: unpublishing frees the tarball, never
// the number. A run that computes a burned version cannot publish, so fail it before the tag is cut.
// semantic-release hands every plugin a deep clone of its context, so a plugin cannot rewrite
// nextRelease.version to dodge the collision — the version line has to be steered by the last tag
// and the release type instead. See docs/release-strategy.md.
export function verifyRelease({ versions = [] }, { nextRelease, logger }) {
  if (versions.includes(nextRelease.version)) {
    throw new Error(
      `Refusing to release ${nextRelease.version}: that version is burned on npm and can never be published again. ` +
        `Resume the line above the burned range, or keep releases at patch level below it — see docs/release-strategy.md.`,
    );
  }
  logger.log(`Version ${nextRelease.version} is clear of the burned versions`);
}
