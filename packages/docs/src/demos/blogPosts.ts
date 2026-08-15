import { faker } from "@faker-js/faker";

/** A mock blog post, dated for the classic `/blog/:year/:month/:day/:slug` URL shape. */
export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  year: number;
  month: number;
  day: number;
};

const POST_COUNT = 24;

const makePost = (): BlogPost => {
  const date = faker.date.between({ from: "2022-01-01", to: "2024-12-31" });
  return {
    slug: faker.helpers.slugify(faker.lorem.words({ min: 2, max: 5 })).toLowerCase(),
    title: faker.lorem.sentence({ min: 3, max: 7 }).replace(/\.$/, ""),
    excerpt: faker.lorem.sentences(2),
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
};

// One slug can only appear once per day (that's what the route pattern binds), so keep
// generating until every post's (date, slug) pair is unique.
const makePosts = (count: number): BlogPost[] => {
  const seen = new Set<string>();
  const posts: BlogPost[] = [];
  while (posts.length < count) {
    const post = makePost();
    const key = `${post.year}-${post.month}-${post.day}-${post.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    posts.push(post);
  }
  return posts;
};

faker.seed(404);
/** Fixed mock post data, seeded so demo content (and its SSG prerender) is stable across builds. */
export const blogPosts: BlogPost[] = makePosts(POST_COUNT);

/** Whether year/month/day form an actual calendar date (rejects e.g. 30 February). */
export const isValidCalendarDate = (year: number, month: number, day: number): boolean => {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

export const postsForYear = (year: number): BlogPost[] => blogPosts.filter((post) => post.year === year);

export const postsForMonth = (year: number, month: number): BlogPost[] =>
  postsForYear(year).filter((post) => post.month === month);

export const postsForDay = (year: number, month: number, day: number): BlogPost[] =>
  postsForMonth(year, month).filter((post) => post.day === day);

export const postBySlug = (year: number, month: number, day: number, slug: string): BlogPost | undefined =>
  postsForDay(year, month, day).find((post) => post.slug === slug);

const distinctSorted = (values: number[]): number[] => [...new Set(values)].sort((a, b) => a - b);

export const yearsWithPosts = (): number[] => distinctSorted(blogPosts.map((post) => post.year));

export const monthsInYear = (year: number): number[] => distinctSorted(postsForYear(year).map((post) => post.month));

export const daysInMonth = (year: number, month: number): number[] =>
  distinctSorted(postsForMonth(year, month).map((post) => post.day));

/** Every concrete blog URL the demo can reach, for the docs site's SSG prerender list. */
export const blogStaticPaths = (): string[] => {
  const paths = ["/demos/blog-routing"];
  for (const year of yearsWithPosts()) {
    paths.push(`/demos/blog-routing/${year}`);
    for (const month of monthsInYear(year)) {
      paths.push(`/demos/blog-routing/${year}/${month}`);
      for (const day of daysInMonth(year, month)) {
        paths.push(`/demos/blog-routing/${year}/${month}/${day}`);
      }
    }
  }
  for (const post of blogPosts) {
    paths.push(`/demos/blog-routing/${post.year}/${post.month}/${post.day}/${post.slug}`);
  }
  return paths;
};
