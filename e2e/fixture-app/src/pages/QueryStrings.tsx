import { useEffect } from "react";

const useTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

// Mirrors demo/cypress/integration/03QueryStrings.js. `jarl-atoms` does now
// support query params via `queryAtom`, but this page has not been wired up to
// it yet, so it still renders only the static shell needed by the "loads home
// page" and default "light theme" scenarios; the search / ?theme=dark /
// theme-toggle scenarios remain test.fixme()'d in the spec.
const QueryStrings = () => {
  useTitle("Query Strings - Home - JARL");
  return (
    <div data-test="page" style={{ backgroundColor: "rgb(255, 255, 255)" }}>
      <div data-test="header" style={{ color: "rgb(0, 0, 0)" }}>
        Home
      </div>
      <form onSubmit={(event) => event.preventDefault()}>
        <input data-test="search-text" type="text" />
        <button data-test="search-button" type="submit">
          Search
        </button>
      </form>
      <p>Query-string aware routing (search, ?theme=) is not yet wired up in this fixture.</p>
    </div>
  );
};

export default QueryStrings;
