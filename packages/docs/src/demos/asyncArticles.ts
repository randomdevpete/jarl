import { faker } from "@faker-js/faker";

/** An article as the demo's stand-in database stores it. */
export type Article = {
  slug: string;
  title: string;
  author: string;
  body: string;
};

const ARTICLE_COUNT = 5;

/** Enough for the pending state to be visible, short enough not to slow the site's prerender. */
const LOOKUP_LATENCY_MS = 150;

const makeArticle = (): Article => ({
  slug: faker.helpers.slugify(faker.lorem.words({ min: 2, max: 4 })).toLowerCase(),
  title: faker.lorem.sentence({ min: 3, max: 6 }).replace(/\.$/, ""),
  author: faker.person.fullName(),
  body: faker.lorem.paragraph(),
});

faker.seed(406);
const articles: Article[] = Array.from({ length: ARTICLE_COUNT }, makeArticle);

/** Every slug the database holds, for the demo's index and the site's prerender list. */
export const articleSlugs = (): string[] => articles.map((article) => article.slug);

/** The demo's stand-in for a database call: the article at `slug`, or `undefined` if there is none. */
export const findArticle = (slug: string): Promise<Article | undefined> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(articles.find((article) => article.slug === slug)), LOOKUP_LATENCY_MS);
  });
