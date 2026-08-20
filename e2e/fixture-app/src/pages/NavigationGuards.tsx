import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { Link, useNavigate, useNavigationGuard } from "jarl-react";
import { navigationGuardsAtom, navigationGuardsAwayAtom, unsavedEditsAtom, unsavedEditsGuard } from "../routes";

const useTitle = (title: string) => {
  useEffect(() => {
    document.title = title;
  }, [title]);
};

// Wraps both pages of the demo so the guard and the dirty flag survive a navigation between
// them, which is what the back/forward scenarios need.
const NavigationGuards = () => {
  const away = useAtomValue(navigationGuardsAwayAtom);
  const [unsavedEdits, setUnsavedEdits] = useAtom(unsavedEditsAtom);
  const navigateAway = useNavigate(navigationGuardsAwayAtom);
  useNavigationGuard(unsavedEditsGuard);
  useTitle(`Navigation Guards - ${away.match ? "Away" : "Editor"} - JARL`);

  return (
    <div>
      <nav>
        <Link route={navigationGuardsAtom} data-test="editor-link">
          Editor
        </Link>{" "}
        <Link route={navigationGuardsAwayAtom} data-test="away-link">
          Away
        </Link>
      </nav>
      <div data-test="header">{away.match ? "Away" : "Editor"}</div>
      <label>
        <input
          data-test="dirty-toggle"
          type="checkbox"
          checked={unsavedEdits}
          onChange={(event) => setUnsavedEdits(event.target.checked)}
        />
        Unsaved edits
      </label>
      <button data-test="navigate-away" onClick={() => navigateAway({})}>
        Navigate away
      </button>
    </div>
  );
};

export default NavigationGuards;
