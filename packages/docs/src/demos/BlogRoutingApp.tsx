import { Link, Route, Switch } from "jarl-react";
import { blogRoutingDemoRoute, blogYearRoute, blogMonthRoute, blogDayRoute, blogPostRoute } from "../router/routes";
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

const BlogNav = () => (
  <nav>
    <Link route={blogRoutingDemoRoute} to={{}} exact>
      All posts
    </Link>
  </nav>
);

const BlogNotFound = ({ reason }: { reason: string }) => (
  <div>
    <h3>Not found</h3>
    <p>{reason}</p>
    <p>
      <Link route={blogRoutingDemoRoute} to={{}}>
        Back to all posts
      </Link>
    </p>
  </div>
);

const PostList = ({ posts }: { posts: BlogPost[] }) => (
  <ul>
    {posts.map((post) => (
      <li key={post.slug}>
        <Link route={blogPostRoute} to={post}>
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
          <Link route={blogYearRoute} to={{ year }}>
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
            <Link route={blogMonthRoute} to={{ year, month }}>
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
            <Link route={blogDayRoute} to={{ year, month, day }}>
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
  if (!isValidCalendarDate(year, month, day)) {
    return <BlogNotFound reason={`${MONTH_NAMES[month - 1]} ${day}, ${year} isn't a real date.`} />;
  }
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
 * Demo of a classic /blog/:year/:month/:day/:slug tree, composed from three
 * `numericRouteAtom`s chained as parent/child rather than a single date primitive. Each level
 * validates its own segment's range (via `numericRouteAtom`'s `min`/`max`) plus, once matched,
 * that the date is real and posts actually exist there - falling back to `BlogNotFound` either
 * way, and to the `Switch`'s own fallback when no level's URL shape matches at all.
 */
export const BlogRoutingApp = () => (
  <>
    <BlogNav />
    <Switch fallback={<BlogNotFound reason="No blog route matches this address." />}>
      <Route on={blogRoutingDemoRoute} exact>
        <BlogIndex />
      </Route>
      <Route on={blogYearRoute} exact>
        {({ year }) => <YearPage year={year} />}
      </Route>
      <Route on={blogMonthRoute} exact>
        {({ year, month }) => <MonthPage year={year} month={month} />}
      </Route>
      <Route on={blogDayRoute} exact>
        {({ year, month, day }) => <DayPage year={year} month={month} day={day} />}
      </Route>
      <Route on={blogPostRoute} exact>
        {({ year, month, day, slug }) => <PostPage year={year} month={month} day={day} slug={slug} />}
      </Route>
    </Switch>
  </>
);

export default BlogRoutingApp;
