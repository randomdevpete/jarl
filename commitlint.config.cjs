// Gates the commit `type` that .releaserc.json's commit-analyzer needs to
// tell releasable work from everything else - see docs/release-strategy.md.
// subject-case, header-max-length, body-max-line-length and
// footer-max-line-length are disabled: they flag this project's normal
// prose (a proper noun leading a subject, a long line quoting
// CODING-STYLE.md or a path), not the type prefix this enforces.
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [0],
    "body-max-line-length": [0],
    "footer-max-line-length": [0],
    "subject-case": [0],
  },
};
