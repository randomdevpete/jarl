import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { redirectsMovedAtom, redirectsAdminAtom, redirectsContentSlugAtom } from "../routes";
import { Link } from "jarl-react";

const useTitle = (title: string) => {
    useEffect(() => {
        document.title = title;
    }, [title]);
};

// A little JARL etymology, mirroring the flavour of the v1 demo content.
const CONTENT: Record<string, string> = {
    "about-us": "A jarl was a Norse or Danish chief, a rank of nobility above a freeman and below a king.",
};

const Landing = () => {
    useTitle("Redirects - Landing - JARL");
    return (
        <div>
            <div data-test="header">Landing</div>
            <p data-test="redirect-reason">no redirect</p>
            {/*
              The v2 route atoms have no redirect/resolve support yet
              is not wired up in this fixture, so these links land on pages it doesn't
              render anything useful for. The hrefs are still correct so the
              fixme()'d assertions on href attributes have something real to
              check once the corresponding tests are un-skipped.
            */}
            <Link route={redirectsMovedAtom} data-test="moved-link">
                Moved page
            </Link>
            <Link route={redirectsAdminAtom} data-test="admin-link">
                Admin page
            </Link>
            <Link route={redirectsContentSlugAtom} to={{ slug: "about-us" }} data-test="found-content-link">
                About us
            </Link>
            <Link route={redirectsContentSlugAtom} to={{ slug: "not-a-real-page" }} data-test="missing-content-link">
                Missing content
            </Link>
        </div>
    );
};

const Content = ({ slug }: { slug: string }) => {
    const body = CONTENT[slug];
    useTitle(`Redirects - ${slug} - JARL`);
    return (
        <div>
            <div data-test="header">{slug}</div>
            <p data-test="body">{body ?? `Content was not found: '${slug}'`}</p>
        </div>
    );
};

// Mirrors demo/cypress/integration/04Redirects.js. Only the "known slug"
// content page and the static landing page are real - everything involving
// an actual redirect (moved/admin/missing content -> back to landing with a
// reason) is test.fixme()'d pending fixture wiring.
const Redirects = () => {
    const content = useAtomValue(redirectsContentSlugAtom);

    if (content.match && content.values) {
        return <Content slug={content.values.slug} />;
    }
    return <Landing />;
};

export default Redirects;
