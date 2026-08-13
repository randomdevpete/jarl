import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useEffect } from "react";
import { locationAtom, queryAtom, isRedirect } from "jarl-atoms";
import { Link, useHref } from "jarl-react";
import {
  redirectsAtom,
  redirectsMovedAtom,
  redirectsMovedRedirectAtom,
  redirectsAdminAtom,
  redirectsContentSlugAtom,
  redirectsAdminDataLoadableAtom,
  redirectsContentDataLoadableAtom,
  isAdminAuthenticatedAtom,
} from "../routes";

const useTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

// jotai-location always serializes a written location's searchParams via
// `URLSearchParams#toString`, which form-encodes (space -> '+', ':' ->
// '%3A'). The ported e2e specs assert on the raw encoding a browser's own
// URL applies instead (space -> '%20', ':' left alone) - keep real entries
// (so reads like `useAtomValue(queryAtom)` still work) but hand the reason's
// raw text straight through, letting `applyLocation`'s `url.search =` do
// that encoding itself.
const reasonSearchParams = (reason: string): URLSearchParams => {
  const params = new URLSearchParams();
  params.set("because", reason);
  params.toString = () => `because=${reason}`;
  return params;
};

/** Replace-navigates to the redirects landing page with `reason` once `shouldRedirect` is true. */
const useRedirectWithReason = (shouldRedirect: boolean, reason: string) => {
  const setLocation = useSetAtom(locationAtom);
  const landingHref = useHref(redirectsAtom, {});
  useEffect(() => {
    if (!shouldRedirect) return;
    setLocation((prev) => ({ ...prev, pathname: landingHref, searchParams: reasonSearchParams(reason) }), {
      replace: true,
    });
  }, [shouldRedirect, reason, landingHref, setLocation]);
};

const Landing = () => {
  useTitle("Redirects - Landing - JARL");
  return <div data-test="header">Landing</div>;
};

const AdminPage = () => {
  const admin = useAtomValue(redirectsAdminDataLoadableAtom);
  const redirecting = admin.state === "hasData" && isRedirect(admin.data);
  useRedirectWithReason(redirecting, "Not authorised");
  useTitle("Redirects - Admin - JARL");
  if (admin.state !== "hasData" || !admin.data || isRedirect(admin.data)) {
    return null;
  }
  return (
    <div>
      <div data-test="header">Admin</div>
      <p data-test="body">{admin.data.body}</p>
    </div>
  );
};

const ContentPage = ({ slug }: { slug: string }) => {
  const content = useAtomValue(redirectsContentDataLoadableAtom);
  const redirecting = content.state === "hasData" && isRedirect(content.data);
  useRedirectWithReason(redirecting, `Content was not found: '${slug}'`);
  useTitle(`Redirects - ${slug} - JARL`);
  if (content.state !== "hasData" || !content.data || isRedirect(content.data)) {
    return null;
  }
  return (
    <div>
      <div data-test="header">{slug}</div>
      <p data-test="body">{content.data.body}</p>
    </div>
  );
};

// Mirrors demo/cypress/integration/04Redirects.js. Nav links and the
// redirect-reason banner persist across every sub-view (like BasicRouting's
// nav), since a content page can itself lead straight into another redirect.
const Redirects = () => {
  const content = useAtomValue(redirectsContentSlugAtom);
  const admin = useAtomValue(redirectsAdminAtom);
  const moved = useAtomValue(redirectsMovedRedirectAtom);
  const { because } = useAtomValue(queryAtom);
  const [isAuthenticated, setIsAuthenticated] = useAtom(isAdminAuthenticatedAtom);

  useRedirectWithReason(moved.match, "Permanently moved");

  let view;
  if (content.match && content.values) {
    view = <ContentPage slug={content.values.slug} />;
  } else if (admin.match) {
    view = <AdminPage />;
  } else {
    view = <Landing />;
  }

  return (
    <div>
      {view}
      <p data-test="redirect-reason">{because ?? "no redirect"}</p>
      <button data-test="login-button" type="button" onClick={() => setIsAuthenticated((prev) => !prev)}>
        {isAuthenticated ? "Logout" : "Login"}
      </button>
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

export default Redirects;
