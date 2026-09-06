import { atom } from "jotai";
import { rootRouteAtom, navigationGuardAtom, staticRouteAtom } from "jarl-atoms";
import { Link, Route, Switch, useAtom, useAtomValue, useNavigate, useNavigationGuard, useSetAtom } from "jarl-react";

// The page this demo is mounted on, so its whole tree below is plain module-level atoms.
const cancelNavigationRoot = rootRouteAtom({ basePath: "/demos/cancel-navigation" });
const otherRoute = staticRouteAtom("other", { parent: cancelNavigationRoot });

const SAVED = "Dear reviewer,";

// Editor state lives in module-level atoms, not component state: the guard is an atom too, and
// reads the same dirty flag whichever page of the demo is on screen.
const savedAtom = atom(SAVED);
const draftAtom = atom(SAVED);
const dirtyAtom = atom((get) => get(draftAtom) !== get(savedAtom));

const saveAtom = atom(null, (get, set) => set(savedAtom, get(draftAtom)));
const discardAtom = atom(null, (get, set) => set(draftAtom, get(savedAtom)));

/**
 * The guard itself: a plain derived atom returning the confirm message while the draft differs
 * from what was saved, and `null` once it doesn't. `useNavigationGuard` below is what makes it
 * bite - nothing else in this demo knows the guard exists.
 */
const unsavedEditsGuard = navigationGuardAtom((get) =>
  get(dirtyAtom) ? "You have unsaved edits. Leave anyway?" : null,
);

const Editor = () => {
  const [draft, setDraft] = useAtom(draftAtom);
  const dirty = useAtomValue(dirtyAtom);
  const save = useSetAtom(saveAtom);
  const discard = useSetAtom(discardAtom);
  const goOther = useNavigate(otherRoute);

  return (
    <div>
      <h3>Editor</h3>
      <p>
        <textarea rows={3} cols={40} value={draft} onChange={(event) => setDraft(event.target.value)} />
      </p>
      <p>
        <button type="button" disabled={!dirty} onClick={() => save()}>
          Save
        </button>{" "}
        <button type="button" disabled={!dirty} onClick={() => discard()}>
          Discard
        </button>{" "}
        <button type="button" onClick={() => goOther({})}>
          Leave via useNavigate
        </button>
      </p>
      <p>{dirty ? "Unsaved edits - every route change is confirmed first." : "Saved - navigation is unguarded."}</p>
    </div>
  );
};

const Other = () => (
  <div>
    <h3>Other page</h3>
    <p>
      Getting here while the editor was dirty took a confirmation - whether by link, by <code>useNavigate</code>, or by
      the browser&apos;s back button.
    </p>
  </div>
);

const CancelNavigationNotFound = () => (
  <div>
    <h3>Not found</h3>
    <p>
      <Link route={cancelNavigationRoot} to={{}}>
        Back to the editor
      </Link>
    </p>
  </div>
);

/**
 * Demo of vetoing navigation while a form has unsaved edits. The blocking is done by a
 * `navigationGuardAtom`, registered for the lifetime of this component with `useNavigationGuard`,
 * so it covers every way the URL can move - the ordinary `Link`s below, the `useNavigate` button,
 * a direct route-atom write, and the browser's own back/forward buttons - rather than one link
 * component's `onClick`.
 */
export const CancelNavigationApp = () => {
  useNavigationGuard(unsavedEditsGuard);

  return (
    <>
      <nav>
        <Link route={cancelNavigationRoot} to={{}} exact>
          Editor
        </Link>
        <Link route={otherRoute} to={{}}>
          Other page
        </Link>
      </nav>
      <p>
        Edit the text, then try to leave. The links above, the <code>useNavigate</code> button and the browser&apos;s
        own back/forward buttons all stop at the same confirm; save or discard, and none of them do.
      </p>
      <Switch fallback={<CancelNavigationNotFound />}>
        <Route on={cancelNavigationRoot} exact>
          <Editor />
        </Route>
        <Route on={otherRoute} exact>
          <Other />
        </Route>
      </Switch>
    </>
  );
};

export default CancelNavigationApp;
