import { Link, Route, Switch, useAtomValue } from "jarl-react";
import { asyncArticleRoute, asyncLookupDemoRoute, asyncLookupSlugRoute } from "../router/routes";
import { articleSlugs } from "./asyncArticles";

const MISSING_SLUG = "no-such-article";

const ArticleIndex = () => (
  <div>
    <h3>Articles</h3>
    <ul>
      {articleSlugs().map((slug) => (
        <li key={slug}>
          <Link route={asyncLookupSlugRoute} to={{ slug }}>
            {slug}
          </Link>
        </li>
      ))}
      <li>
        <Link route={asyncLookupSlugRoute} to={{ slug: MISSING_SLUG }}>
          {MISSING_SLUG}
        </Link>{" "}
        <span>&mdash; not in the database, so this address 404s</span>
      </li>
    </ul>
  </div>
);

const ArticleNotFound = () => (
  <div>
    <h3>Not found</h3>
    <p>The database has no article at this address, so the route never matched.</p>
    <p>
      <Link route={asyncLookupDemoRoute} to={{}}>
        Back to all articles
      </Link>
    </p>
  </div>
);

/**
 * Demo of a route whose existence only a database can answer: `asyncArticleRoute` matches only
 * when the lookup finds something, and binds what it found to the route's own `values`, so the
 * page below renders `article` without fetching anything itself. The same settled lookup decides
 * the server's 404 status - see `notFoundAtom` in router/routes.ts.
 */
export const AsyncLookupApp = () => {
  const pending = useAtomValue(asyncArticleRoute.pending);
  return (
    <>
      <nav>
        <Link route={asyncLookupDemoRoute} to={{}} exact>
          All articles
        </Link>
      </nav>
      {pending ? (
        <p>Looking the slug up&hellip;</p>
      ) : (
        <Switch fallback={<ArticleNotFound />}>
          <Route on={asyncLookupDemoRoute} exact>
            <ArticleIndex />
          </Route>
          <Route on={asyncArticleRoute} exact>
            {({ article }) => (
              <article>
                <h3>{article.title}</h3>
                <p>
                  <em>by {article.author}</em>
                </p>
                <p>{article.body}</p>
              </article>
            )}
          </Route>
        </Switch>
      )}
    </>
  );
};

export default AsyncLookupApp;
