import { useState } from "react";
import { Link, Route, useIsActive, useNavigate } from "jarl-react";
import { aboutRoute, productRoute, productsRoute, rootRoute, searchQueryRoute } from "./routes";

const SearchForm = () => {
  const [searchText, setSearchText] = useState("");
  const navigate = useNavigate(searchQueryRoute);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        navigate({ q: searchText });
      }}
    >
      <input aria-label="search" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
      <button type="submit">Search</button>
    </form>
  );
};

const App = () => {
  const productsActive = useIsActive(productsRoute);
  return (
    <>
      <nav>
        <Link route={rootRoute} to={{}} exact activeClassName="active">
          Home
        </Link>
        <Link route={aboutRoute} to={{}} activeClassName="active">
          About
        </Link>
        <Link route={productRoute} to={{ productId: "123" }} activeClassName="active">
          Product 123
        </Link>
      </nav>
      <SearchForm />
      <Route on={rootRoute} exact>
        <h1>Home</h1>
      </Route>
      <Route on={aboutRoute}>
        <h1>About</h1>
      </Route>
      <Route on={productRoute}>{({ productId }) => <h1>{`Product ${productId}`}</h1>}</Route>
      <p data-testid="products-active">{String(productsActive)}</p>
    </>
  );
};

export default App;
