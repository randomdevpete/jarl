import { rootRouteAtom, DefaultParams, RouteOptions, routeAtom, staticRouteAtom, validateRouteAtom } from "jarl-atoms";
import { Link, Route, Switch } from "jarl-react";
import { isValidCalendarDate } from "./blogPosts";
import { DateSegment, formatDateSegment, sampleDates, sampleFiles } from "./complexRoutingSamples";

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
    formatDateSegment,
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

// The page this demo is mounted on, so its whole tree below is plain module-level atoms.
const complexRoot = rootRouteAtom({ basePath: "/demos/complex-routing" });

const archiveRoute = staticRouteAtom("archive", { parent: complexRoot });
const archiveDateSegment = dateSegmentRouteAtom({ parent: archiveRoute });
// The segment's own syntax only rules out shapes like `2024-1-1`; whether the three parts spell a
// real calendar date is a constraint across all of them, so it is applied as part of matching
// rather than checked in a page component.
const archiveDateRoute = validateRouteAtom(archiveDateSegment, ({ year, month, day }) =>
  isValidCalendarDate(year, month, day),
);

const filesRoute = staticRouteAtom("files", { parent: complexRoot });
const fileRoute = filenameRouteAtom({ parent: filesRoute });

const FILE_KIND: Record<string, string> = {
  pdf: "document",
  txt: "text file",
  zip: "archive",
};

const ComplexNav = () => (
  <nav>
    <Link route={complexRoot} to={{}} exact>
      Overview
    </Link>
  </nav>
);

const ComplexIndex = () => (
  <div>
    <h3>Custom path segments</h3>
    <p>
      Dates as one <code>yyyy-mm-dd</code> segment, validated against the real calendar:
    </p>
    <ul>
      {sampleDates.map((date) => (
        <li key={formatDateSegment(date)}>
          <Link route={archiveDateRoute} to={date}>
            /archive/{formatDateSegment(date)}
          </Link>
        </li>
      ))}
    </ul>
    <p>
      Filenames as one <code>name.ext</code> segment:
    </p>
    <ul>
      {sampleFiles.map(({ name, ext, label }) => (
        <li key={`${name}.${ext}`}>
          <Link route={fileRoute} to={{ name, ext }}>
            /files/{name}.{ext}
          </Link>{" "}
          &mdash; {label}
        </li>
      ))}
    </ul>
  </div>
);

const ComplexNotFound = () => (
  <div>
    <h3>Not found</h3>
    <p>
      No custom segment here matched: an out-of-range date, an invalid calendar date, or a filename with no extension.
    </p>
    <p>
      <Link route={complexRoot} to={{}}>
        Back to overview
      </Link>
    </p>
  </div>
);

const ArchivePage = ({ year, month, day }: DateSegment) => (
  <div>
    <h3>Archive for {formatDateSegment({ year, month, day })}</h3>
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
 * calendar via `validateRouteAtom`, and `name.ext` under `/files`.
 */
export const ComplexRoutingApp = () => (
  <>
    <ComplexNav />
    <Switch fallback={<ComplexNotFound />}>
      <Route on={complexRoot} exact>
        <ComplexIndex />
      </Route>
      <Route on={archiveDateRoute} exact>
        {(values) => <ArchivePage {...values} />}
      </Route>
      <Route on={fileRoute} exact>
        {(values) => <FilePage {...values} />}
      </Route>
    </Switch>
  </>
);

export default ComplexRoutingApp;
