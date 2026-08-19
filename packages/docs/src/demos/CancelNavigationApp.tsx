import { ReactNode, useState } from "react";
import { Route, useLink } from "jarl-react";
import { DefaultParams, RouteAtom } from "jarl-atoms";
import { cancelNavigationDemoRoute, cancelNavigationOtherRoute } from "../router/routes";

/** A nav link that confirms before leaving while `dirty` is true, discarding the click if declined. */
const GuardedLink = <T extends DefaultParams>({
  route,
  to,
  dirty,
  children,
}: {
  route: RouteAtom<T>;
  to: T;
  dirty: boolean;
  children: ReactNode;
}) => {
  const { href, active, onClick } = useLink(route, to, { exact: true });
  return (
    <a
      href={href}
      data-active={active || undefined}
      onClick={(event) => {
        event.preventDefault();
        if (dirty && !window.confirm("You have unsaved changes. Leave without saving?")) return;
        onClick();
      }}
    >
      {children}
    </a>
  );
};

const Editor = ({ dirty, setDirty }: { dirty: boolean; setDirty: (dirty: boolean) => void }) => {
  const [text, setText] = useState("");
  return (
    <div>
      <h3>Editor</h3>
      <textarea
        rows={3}
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setDirty(true);
        }}
      />
      <p>{dirty ? "Unsaved changes." : "Nothing to save."}</p>
      <button type="button" disabled={!dirty} onClick={() => setDirty(false)}>
        Save
      </button>
    </div>
  );
};

const Other = () => (
  <div>
    <h3>Other page</h3>
    <p>Reached from the editor - navigating away while it&apos;s dirty asks for confirmation first.</p>
  </div>
);

/**
 * Demo of blocking in-app navigation while a form has unsaved edits. Built on `useLink` directly
 * rather than `Link`, since the guard needs to intercept the click before the route atom is
 * written - `dirty` state itself is plain component state, not a route concern.
 */
export const CancelNavigationApp = () => {
  const [dirty, setDirty] = useState(false);
  return (
    <>
      <nav>
        <GuardedLink route={cancelNavigationDemoRoute} to={{}} dirty={dirty}>
          Editor
        </GuardedLink>
        <GuardedLink route={cancelNavigationOtherRoute} to={{}} dirty={dirty}>
          Other
        </GuardedLink>
      </nav>
      <Route on={cancelNavigationDemoRoute} exact>
        <Editor dirty={dirty} setDirty={setDirty} />
      </Route>
      <Route on={cancelNavigationOtherRoute} exact>
        <Other />
      </Route>
    </>
  );
};

export default CancelNavigationApp;
