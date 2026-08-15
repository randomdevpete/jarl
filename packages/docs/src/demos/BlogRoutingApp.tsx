import { useMemo } from "react";
import { rootAtom as defaultRootAtom, numericRouteAtom, paramRouteAtom, DefaultParams, RouteAtom } from "jarl-atoms";
import { Link, Route, Switch } from "jarl-react";
import {
  BlogPost,
  isValidCalendarDate,
  postBySlug,
  postsForDay,
  postsForMonth,
  postsForYear,
  daysInMonth,
  monthsInYear,
  yearsWithPosts,
} from "./blogPosts";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const formatDate = (post: BlogPost) => `${MONTH_NAMES[post.month - 1]} ${post.day}, ${post.year}`;

// The demo's whole route tree hangs off whatever root it is given, so the app
// never knows the URL it is mounted on.
const createBlogRoutes = (root: RouteAtom<DefaultParams>) => {
  const year = numericRouteAtom("year", { parent: root });
  const month = numericRouteAtom("month", { parent: year, min: 1, max: 12 });
  const day = numericRouteAtom("day", { parent: month, min: 1, max: 31 });
  const post = paramRouteAtom("slug", { parent: day });
  return { root, year, month, day, post };
};

type BlogRoutes = ReturnType<typeof createBlogRoutes>;

const BlogNav = ({ routes }: { routes: BlogRoutes }) => (
  <nav>
    <Link route={routes.root} to={{}} exact>
      All posts
    </Link>
  </nav>
);

const BlogNotFound = ({ routes, reason }: { routes: BlogRoutes; reason: string }) => (
  <div>
    <h3>Not found</h3>
    <p>{reason}</p>
    <p>
      <Link route={routes.root} to={{}}>
        Back to all posts
      </Link>
    </p>
  </div>
);

const PostList = ({ routes, posts }: { routes: BlogRoutes; posts: BlogPost[] }) => (
  <ul>
    {posts.map((post) => (
      <li key={post.slug}>
        <Link route={routes.post} to={post}>
          {post.title}
        </Link>{" "}
        <span>&mdash; {formatDate(post)}</span>
      </li>
    ))}
  </ul>
);

const BlogIndex = ({ routes }: { routes: BlogRoutes }) => (
  <div>
    <h3>Blog</h3>
    <ul>
      {yearsWithPosts().map((year) => (
        <li key={year}>
          <Link route={routes.year} to={{ year }}>
            {year}
          </Link>{" "}
          ({postsForYear(year).length} posts)
        </li>
      ))}
    </ul>
  </div>
);

const YearPage = ({ routes, year }: { routes: BlogRoutes; year: number }) => {
  const posts = postsForYear(year);
  if (posts.length === 0) {
    return <BlogNotFound routes={routes} reason={`No posts in ${year}.`} />;
  }
  return (
    <div>
      <h3>{year}</h3>
      <ul>
        {monthsInYear(year).map((month) => (
          <li key={month}>
            <Link route={routes.month} to={{ year, month }}>
              {MONTH_NAMES[month - 1]}
            </Link>{" "}
            ({postsForMonth(year, month).length})
          </li>
        ))}
      </ul>
      <PostList routes={routes} posts={posts} />
    </div>
  );
};

const MonthPage = ({ routes, year, month }: { routes: BlogRoutes; year: number; month: number }) => {
  const posts = postsForMonth(year, month);
  if (posts.length === 0) {
    return <BlogNotFound routes={routes} reason={`No posts in ${MONTH_NAMES[month - 1]} ${year}.`} />;
  }
  return (
    <div>
      <h3>
        {MONTH_NAMES[month - 1]} {year}
      </h3>
      <ul>
        {daysInMonth(year, month).map((day) => (
          <li key={day}>
            <Link route={routes.day} to={{ year, month, day }}>
              {day}
            </Link>{" "}
            ({postsForDay(year, month, day).length})
          </li>
        ))}
      </ul>
      <PostList routes={routes} posts={posts} />
    </div>
  );
};

const DayPage = ({ routes, year, month, day }: { routes: BlogRoutes; year: number; month: number; day: number }) => {
  if (!isValidCalendarDate(year, month, day)) {
    return <BlogNotFound routes={routes} reason={`${MONTH_NAMES[month - 1]} ${day}, ${year} isn't a real date.`} />;
  }
  const posts = postsForDay(year, month, day);
  if (posts.length === 0) {
    return <BlogNotFound routes={routes} reason={`No posts on ${MONTH_NAMES[month - 1]} ${day}, ${year}.`} />;
  }
  return (
    <div>
      <h3>
        {MONTH_NAMES[month - 1]} {day}, {year}
      </h3>
      <PostList routes={routes} posts={posts} />
    </div>
  );
};

const PostPage = ({
  routes,
  year,
  month,
  day,
  slug,
}: {
  routes: BlogRoutes;
  year: number;
  month: number;
  day: number;
  slug: string;
}) => {
  const post = postBySlug(year, month, day, slug);
  if (!post) {
    return <BlogNotFound routes={routes} reason="No post at this address." />;
  }
  return (
    <article>
      <h3>{post.title}</h3>
      <p>
        <em>{formatDate(post)}</em>
      </p>
      <p>{post.excerpt}</p>
    </article>
  );
};

/**
 * Self-contained demo of a classic /blog/:year/:month/:day/:slug tree: URL-shape 404s via the
 * Switch fallback, content-level 404s via isValidCalendarDate and empty-list checks. Pass the
 * route atom it is mounted on as `rootAtom` and it builds its own tree under that.
 */
export const BlogRoutingApp = ({ rootAtom = defaultRootAtom }: { rootAtom?: RouteAtom<DefaultParams> }) => {
  const routes = useMemo(() => createBlogRoutes(rootAtom), [rootAtom]);
  return (
    <>
      <BlogNav routes={routes} />
      <Switch fallback={<BlogNotFound routes={routes} reason="No blog route matches this address." />}>
        <Route on={routes.root} exact>
          <BlogIndex routes={routes} />
        </Route>
        <Route on={routes.year} exact>
          {({ year }) => <YearPage routes={routes} year={year} />}
        </Route>
        <Route on={routes.month} exact>
          {({ year, month }) => <MonthPage routes={routes} year={year} month={month} />}
        </Route>
        <Route on={routes.day} exact>
          {({ year, month, day }) => <DayPage routes={routes} year={year} month={month} day={day} />}
        </Route>
        <Route on={routes.post} exact>
          {({ year, month, day, slug }) => <PostPage routes={routes} year={year} month={month} day={day} slug={slug} />}
        </Route>
      </Switch>
    </>
  );
};

export default BlogRoutingApp;
