import { useMemo } from "react";
import {
  DefaultParams,
  RouteAtom,
  RouteOptions,
  routeAtom,
  rootAtom as defaultRootAtom,
  staticRouteAtom,
  validateAtom,
} from "jarl-atoms";
import { Link, Route, Switch } from "jarl-react";
import { isValidCalendarDate } from "./blogPosts";
import { sampleDates, sampleFiles } from "./complexRoutingSamples";

type DateSegment = { year: number; month: number; day: number };

const DATE_SEGMENT = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Binds one path segment shaped `yyyy-mm-dd` to its numeric parts: no separate segment per part,
 * unlike the blog demo's `/:year/:month/:day` chain. `routeAtom` is the right primitive here - the
 * segment syntax itself, not just the value inside it, is non-standard.
 * exception: Teaching material on public docs site; docstring clarity warranted for custom atoms.
 */
const dateSegmentRouteAtom = <Parent extends DefaultParams>(options?: RouteOptions<Parent>) =>
  routeAtom<DateSegment, Parent>(
    (path) => {
      const match = DATE_SEGMENT.exec(path);
      if (!match) return undefined;
      return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
    },
    ({ year, month, day }) =>
      `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    options,
  );

type FilenameSegment = { name: string; ext: string };

const FILENAME_SEGMENT = /^(.+)\.([^.]+)$/;

/** Binds one path segment shaped `name.ext` to its two parts, e.g. `report.pdf` -> `{ name:
 * "report", ext: "pdf" }`. A segment with no extension doesn't match. */
const filenameRouteAtom = <Parent extends DefaultParams>(options?: RouteOptions<Parent>) =>
  routeAtom<FilenameSegment, Parent>(
    (path) => {
      const match = FILENAME_SEGMENT.exec(path);
      return match ? { name: match[1], ext: match[2] } : undefined;
    },
    (values) => `${values.name}.${values.ext}`,
    options,
  );

// The demo's whole route tree hangs off whatever root it is given, so the app
// never knows the URL it is mounted on.
const createComplexRoutes = (root: RouteAtom<DefaultParams>) => {
  const archive = staticRouteAtom("archive", { parent: root });
  const archiveDate = validateAtom(dateSegmentRouteAtom({ parent: archive }), ({ year, month, day }) =>
    isValidCalendarDate(year, month, day),
  );
  const files = staticRouteAtom("files", { parent: root });
  const file = filenameRouteAtom({ parent: files });
  return { root, archive, archiveDate, files, file };
};

type ComplexRoutes = ReturnType<typeof createComplexRoutes>;

const FILE_KIND: Record<string, string> = {
  pdf: "document",
  txt: "text file",
  zip: "archive",
};

const ComplexNav = ({ routes }: { routes: ComplexRoutes }) => (
  <nav>
    <Link route={routes.root} to={{}} exact>
      Overview
    </Link>
  </nav>
);

const dateFromSegment = (segment: string): DateSegment => {
  const [year, month, day] = segment.split("-").map(Number);
  return { year, month, day };
};

const ComplexIndex = ({ routes }: { routes: ComplexRoutes }) => (
  <div>
    <h3>Custom path segments</h3>
    <p>Dates as one `yyyy-mm-dd` segment, validated against the real calendar:</p>
    <ul>
      {sampleDates.map((date) => (
        <li key={date}>
          <Link route={routes.archiveDate} to={dateFromSegment(date)}>
            /archive/{date}
          </Link>
        </li>
      ))}
    </ul>
    <p>Filenames as one `name.ext` segment:</p>
    <ul>
      {sampleFiles.map(({ name, ext, label }) => (
        <li key={`${name}.${ext}`}>
          <Link route={routes.file} to={{ name, ext }}>
            /files/{name}.{ext}
          </Link>{" "}
          &mdash; {label}
        </li>
      ))}
    </ul>
  </div>
);

const ComplexNotFound = ({ routes }: { routes: ComplexRoutes }) => (
  <div>
    <h3>Not found</h3>
    <p>
      No custom segment here matched: an out-of-range date, an invalid calendar date, or a filename with no extension.
    </p>
    <p>
      <Link route={routes.root} to={{}}>
        Back to overview
      </Link>
    </p>
  </div>
);

const ArchivePage = ({ year, month, day }: DateSegment) => (
  <div>
    <h3>Archive for {`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`}</h3>
    <p>
      Parsed from a single path segment into <code>{`{ year: ${year}, month: ${month}, day: ${day} }`}</code>.
    </p>
  </div>
);

const FilePage = ({ name, ext }: FilenameSegment) => (
  <div>
    <h3>
      {name}.{ext}
    </h3>
    <p>
      Parsed into <code>{`{ name: "${name}", ext: "${ext}" }`}</code> &mdash; treated here as a{" "}
      {FILE_KIND[ext] ?? "file of unknown type"}.
    </p>
  </div>
);

/**
 * Self-contained demo of custom single-segment path atoms, built directly on `routeAtom` rather
 * than `staticRouteAtom`/`paramRouteAtom`: `yyyy-mm-dd` under `/archive`, gated on the real
 * calendar via `validateAtom`, and `name.ext` under `/files`. Pass the route atom it is mounted
 * on as `rootAtom` and it builds its own tree under that.
 */
export const ComplexRoutingApp = ({ rootAtom = defaultRootAtom }: { rootAtom?: RouteAtom<DefaultParams> }) => {
  const routes = useMemo(() => createComplexRoutes(rootAtom), [rootAtom]);
  return (
    <>
      <ComplexNav routes={routes} />
      <Switch fallback={<ComplexNotFound routes={routes} />}>
        <Route on={routes.root} exact>
          <ComplexIndex routes={routes} />
        </Route>
        <Route on={routes.archiveDate} exact>
          {(values) => <ArchivePage {...values} />}
        </Route>
        <Route on={routes.file} exact>
          {(values) => <FilePage {...values} />}
        </Route>
      </Switch>
    </>
  );
};

export default ComplexRoutingApp;
