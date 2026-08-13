import { hydrateRoot } from "react-dom/client";
import { Provider } from "jotai";
import App from "./App";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

hydrateRoot(
  root,
  <Provider>
    <App />
  </Provider>,
);
