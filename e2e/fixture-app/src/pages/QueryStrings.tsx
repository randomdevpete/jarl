import { useAtom, useSetAtom } from "jotai";
import { useEffect, useState } from "react";
import { locationAtom, queryAtom, stringifyQuery } from "jarl-atoms";
import { useHref, useRoute } from "jarl-react";
import { queryStringsSearchAtom } from "../routes";

const useTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

// Mirrors demo/cypress/integration/03QueryStrings.js.
const QueryStrings = () => {
  const search = useRoute(queryStringsSearchAtom);
  const [query, setQuery] = useAtom(queryAtom);
  const setLocation = useSetAtom(locationAtom);
  const searchPath = useHref(queryStringsSearchAtom, {});
  const q = typeof query.q === "string" ? query.q : undefined;
  const dark = query.theme === "dark";
  const [searchText, setSearchText] = useState(q ?? "");

  useTitle(search.match ? "Query Strings - Search - JARL" : "Query Strings - Home - JARL");

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    setLocation((prev) => ({
      ...prev,
      pathname: searchPath,
      searchParams: new URLSearchParams(stringifyQuery({ ...query, q: searchText })),
    }));
  };

  const toggleTheme = () => {
    // `theme` first so a toggle from `?q=hello` lands on `?theme=dark&q=hello`,
    // matching the order the e2e spec asserts on.
    const { theme: _theme, ...rest } = query;
    setQuery({ theme: dark ? undefined : "dark", ...rest });
  };

  return (
    <div data-test="page" style={{ backgroundColor: dark ? "rgb(0, 0, 0)" : "rgb(255, 255, 255)" }}>
      <div data-test="header" style={{ color: dark ? "rgb(255, 255, 255)" : "rgb(0, 0, 0)" }}>
        {search.match ? "Search" : "Home"}
      </div>
      <form onSubmit={handleSearch}>
        <input
          data-test="search-text"
          type="text"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
        />
        <button data-test="search-button" type="submit">
          Search
        </button>
      </form>
      {search.match && <p data-test="search-results">{q}</p>}
      <button type="button" data-test="theme-link" onClick={toggleTheme}>
        {dark ? "Light theme" : "Dark theme"}
      </button>
    </div>
  );
};

export default QueryStrings;
