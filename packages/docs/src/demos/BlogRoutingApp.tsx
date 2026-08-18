import { createRootAtom, numericRouteAtom, paramRouteAtom, validateAtom } from "jarl-atoms";
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

// The page this demo is mounted on, so its whole tree below is plain module-level atoms.
const blogRoot = createRootAtom({ basePath: "/demos/blog-routing" });
const yearRoute = numericRouteAtom("year", { parent: blogRoot });
const monthRoute = numericRouteAtom("month", { parent: yearRoute, min: 1, max: 12 });
const daySegment = numericRouteAtom("day", { parent: monthRoute });
// A segment's own min/max only bounds it in isolation; a real calendar date needs all three
// together, so the whole date is validated as part of matching rather than in a page component.
const dayRoute = validateAtom(daySegment, ({ year, month, day }) => isValidCalendarDate(year, month, day));
const postRoute = paramRouteAtom("slug", { parent: dayRoute });

const BlogNav = () => (
  <nav>
    <Link route={blogRoot} to={{}} exact>
      All posts
    </Link>
  </nav>
);

const BlogNotFound = ({ reason }: { reason: string }) => (
  <div>
    <h3>Not found</h3>
    <p>{reason}</p>
    <p>
      <Link route={blogRoot} to={{}}>
        Back to all posts
      </Link>
    </p>
  </div>
);

const PostList = ({ posts }: { posts: BlogPost[] }) => (
  <ul>
    {posts.map((post) => (
      <li key={post.slug}>
        <Link route={postRoute} to={post}>
          {post.title}
        </Link>{" "}
        <span>&mdash; {formatDate(post)}</span>
      </li>
    ))}
  </ul>
);

const BlogIndex = () => (
  <div>
    <h3>Blog</h3>
    <ul>
      {yearsWithPosts().map((year) => (
        <li key={year}>
          <Link route={yearRoute} to={{ year }}>
            {year}
          </Link>{" "}
          ({postsForYear(year).length} posts)
        </li>
      ))}
    </ul>
  </div>
);

const YearPage = ({ year }: { year: number }) => {
  const posts = postsForYear(year);
  if (posts.length === 0) {
    return <BlogNotFound reason={`No posts in ${year}.`} />;
  }
  return (
    <div>
      <h3>{year}</h3>
      <ul>
        {monthsInYear(year).map((month) => (
          <li key={month}>
            <Link route={monthRoute} to={{ year, month }}>
              {MONTH_NAMES[month - 1]}
            </Link>{" "}
            ({postsForMonth(year, month).length})
          </li>
        ))}
      </ul>
      <PostList posts={posts} />
    </div>
  );
};

const MonthPage = ({ year, month }: { year: number; month: number }) => {
  const posts = postsForMonth(year, month);
  if (posts.length === 0) {
    return <BlogNotFound reason={`No posts in ${MONTH_NAMES[month - 1]} ${year}.`} />;
  }
  return (
    <div>
      <h3>
        {MONTH_NAMES[month - 1]} {year}
      </h3>
      <ul>
        {daysInMonth(year, month).map((day) => (
          <li key={day}>
            <Link route={dayRoute} to={{ year, month, day }}>
              {day}
            </Link>{" "}
            ({postsForDay(year, month, day).length})
          </li>
        ))}
      </ul>
      <PostList posts={posts} />
    </div>
  );
};

const DayPage = ({ year, month, day }: { year: number; month: number; day: number }) => {
  const posts = postsForDay(year, month, day);
  if (posts.length === 0) {
    return <BlogNotFound reason={`No posts on ${MONTH_NAMES[month - 1]} ${day}, ${year}.`} />;
  }
  return (
    <div>
      <h3>
        {MONTH_NAMES[month - 1]} {day}, {year}
      </h3>
      <PostList posts={posts} />
    </div>
  );
};

const PostPage = ({ year, month, day, slug }: { year: number; month: number; day: number; slug: string }) => {
  const post = postBySlug(year, month, day, slug);
  if (!post) {
    return <BlogNotFound reason="No post at this address." />;
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
 * Self-contained demo of a classic /blog/:year/:month/:day/:slug tree: URL-shape 404s (an
 * impossible date included) via the Switch fallback, content-level 404s via empty-list checks.
 */
export const BlogRoutingApp = () => (
  <>
    <BlogNav />
    <Switch fallback={<BlogNotFound reason="No blog route matches this address." />}>
      <Route on={blogRoot} exact>
        <BlogIndex />
      </Route>
      <Route on={yearRoute} exact>
        {({ year }) => <YearPage year={year} />}
      </Route>
      <Route on={monthRoute} exact>
        {({ year, month }) => <MonthPage year={year} month={month} />}
      </Route>
      <Route on={dayRoute} exact>
        {({ year, month, day }) => <DayPage year={year} month={month} day={day} />}
      </Route>
      <Route on={postRoute} exact>
        {({ year, month, day, slug }) => <PostPage year={year} month={month} day={day} slug={slug} />}
      </Route>
    </Switch>
  </>
);

export default BlogRoutingApp;
