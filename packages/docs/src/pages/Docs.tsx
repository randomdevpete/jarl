import gettingStarted from "../content/guides/GettingStarted.md?raw";
import dataLoading from "../content/guides/DataLoading.md?raw";
import pathVariables from "../content/guides/PathVariables.md?raw";
import Markdown from "../lib/Markdown";
import { Link } from "jarl-react";
import { docPageRoute, docPages, DocName } from "../router/routes";

const guides: Record<DocName, string> = {
    "getting-started": gettingStarted,
    "data-loading": dataLoading,
    "path-variables": pathVariables
};

export const DocsIndex = () => (
    <>
        <h1>Docs</h1>
        <p>Guides for using JARL's atomic routing model - the route atoms in <code>jarl-atoms</code> and the React bindings in <code>jarl-react</code>.</p>
        <ul className="doc-index">
            {docPages.map(({ docName, title }) => (
                <li key={docName}>
                    <Link route={docPageRoute} to={{ docName }}>
                        {title}
                    </Link>
                </li>
            ))}
        </ul>
    </>
);

export const DocPage = ({ docName }: { docName: string }) => {
    const source = guides[docName as DocName];
    if (!source) {
        return (
            <>
                <h1>Not found</h1>
                <p>
                    No guide named &ldquo;{docName}&rdquo;. Back to <Link route={docPageRoute} to={{ docName: docPages[0].docName }}>Docs</Link>.
                </p>
            </>
        );
    }
    return <Markdown source={source} />;
};

export default DocsIndex;
