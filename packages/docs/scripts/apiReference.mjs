// Extracts a package's public API - every export of its entry point, with the signature
// and doc comment of each - as markdown for the docs site's content pipeline.
//
// Resolves `typescript` from packages/docs (6.x) rather than the repo root (7.x): the 7.x
// native port drops the JS compiler API this needs, and it is the same constraint that
// rules out TypeDoc and every other generator built on that API.
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const SECTIONS = ["Components", "Hooks", "Functions and atoms", "Classes", "Types"];

const compilerOptions = (tsconfigPath) => {
  const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  return ts.parseJsonConfigFileContent(config, ts.sys, path.dirname(tsconfigPath)).options;
};

/** Module basenames in the order the entry point re-exports them, so the reference reads in source order. */
const reexportOrder = (entryFile) =>
  entryFile.statements
    .filter((statement) => ts.isExportDeclaration(statement) && statement.moduleSpecifier)
    .map((statement) => path.basename(statement.moduleSpecifier.text));

const moduleName = (declaration) => path.basename(declaration.getSourceFile().fileName).replace(/\.tsx?$/, "");

const sectionFor = (name, declaration) => {
  if (ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) return "Types";
  if (ts.isClassDeclaration(declaration)) return "Classes";
  if (declaration.getSourceFile().fileName.endsWith(".tsx") && /^[A-Z]/.test(name)) return "Components";
  if (/^use[A-Z]/.test(name)) return "Hooks";
  return "Functions and atoms";
};

/** A class's source text with member bodies emptied, so the signature shows its shape rather than its implementation. */
const classSignature = (declaration) => {
  const source = declaration.getSourceFile();
  const start = declaration.getStart(source);
  let text = declaration.getText(source);
  for (const member of [...declaration.members].reverse()) {
    if (!member.body) continue;
    text = `${text.slice(0, member.body.getStart(source) - start)}{}${text.slice(member.body.getEnd() - start)}`;
  }
  return text;
};

const typeOfExport = (checker, declaration) =>
  checker.getTypeOfSymbolAtLocation(checker.getSymbolAtLocation(declaration.name), declaration);

/** A component's signature, with its props named rather than spelled out as the destructuring pattern it declares. */
const componentSignature = (checker, name, declaration) => {
  const signature = checker.getSignaturesOfType(typeOfExport(checker, declaration), ts.SignatureKind.Call)[0];
  const typeParameters = signature.getDeclaration().typeParameters;
  const generics = typeParameters ? `<${typeParameters.map((parameter) => parameter.getText()).join(", ")}>` : "";
  const props = signature.parameters[0]?.valueDeclaration.type?.getText() ?? "{}";
  return `const ${name}: ${generics}(props: ${props}) => ${checker.typeToString(signature.getReturnType())}`;
};

const signatureOf = (checker, name, declaration, section) => {
  if (ts.isTypeAliasDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)) return declaration.getText();
  if (ts.isClassDeclaration(declaration)) return classSignature(declaration);
  if (section === "Components") return componentSignature(checker, name, declaration);
  const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope;
  return `const ${name}: ${checker.typeToString(typeOfExport(checker, declaration), declaration, flags)}`;
};

const escapeCell = (text) => text.replace(/\|/g, "\\|").replace(/\n+/g, " ").trim();

/**
 * Props table for a component, limited to the properties declared in the package's own source.
 * That bound is what keeps an intersection with `AnchorHTMLAttributes` from spilling every
 * standard anchor attribute into the table.
 */
const propsTable = (checker, declaration, sourceRoot) => {
  const signature = checker.getSignaturesOfType(typeOfExport(checker, declaration), ts.SignatureKind.Call)[0];
  const props = signature?.parameters[0];
  if (!props) return "";
  const rows = checker
    .getTypeOfSymbolAtLocation(props, declaration)
    .getProperties()
    .filter((prop) => prop.declarations?.every((decl) => decl.getSourceFile().fileName.startsWith(sourceRoot)))
    .map((prop) => {
      const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(prop, declaration), declaration);
      const required = (prop.flags & ts.SymbolFlags.Optional) === 0 ? "yes" : "no";
      const description = ts.displayPartsToString(prop.getDocumentationComment(checker));
      return `| \`${prop.name}\` | \`${escapeCell(type)}\` | ${required} | ${escapeCell(description)} |`;
    });
  if (rows.length === 0) return "";
  return ["| prop | type | required | description |", "| --- | --- | --- | --- |", ...rows].join("\n");
};

const entryFor = (checker, symbol, sourceRoot) => {
  const resolved = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declaration = resolved.declarations?.[0];
  // Re-exports of a dependency (jarl-react passes jotai's own hooks through) belong to that
  // dependency's reference, not this one.
  if (!declaration || !declaration.getSourceFile().fileName.startsWith(sourceRoot)) return undefined;
  if (resolved.getJsDocTags(checker).some((tag) => tag.name === "internal")) return undefined;
  const name = symbol.name;
  const section = sectionFor(name, declaration);
  return {
    name,
    section,
    module: moduleName(declaration),
    position: declaration.getStart(),
    signature: signatureOf(checker, name, declaration, section),
    description: ts.displayPartsToString(resolved.getDocumentationComment(checker)),
    props: section === "Components" ? propsTable(checker, declaration, sourceRoot) : "",
  };
};

const renderEntry = ({ name, signature, description, props }) =>
  [`### \`${name}\``, `\`\`\`ts\n${signature}\n\`\`\``, description, props].filter(Boolean).join("\n\n");

/**
 * Markdown reference for one package, from the doc comments on its entry point's exports.
 * `entryPoint` and `tsconfigPath` are absolute paths; everything the entry point exports
 * from within the package's own source is documented, in source order.
 */
export const generateApiReference = ({ entryPoint, tsconfigPath }) => {
  const sourceRoot = path.dirname(entryPoint);
  const program = ts.createProgram([entryPoint], compilerOptions(tsconfigPath));
  const checker = program.getTypeChecker();
  const entryFile = program.getSourceFile(entryPoint);
  if (!entryFile) throw new Error(`No such entry point: ${entryPoint}`);
  const moduleSymbol = checker.getSymbolAtLocation(entryFile);
  if (!moduleSymbol) throw new Error(`Entry point exports nothing: ${entryPoint}`);

  const order = reexportOrder(entryFile);
  const entries = checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => entryFor(checker, symbol, sourceRoot))
    .filter(Boolean)
    .sort((a, b) => order.indexOf(a.module) - order.indexOf(b.module) || a.position - b.position);

  return SECTIONS.filter((section) => entries.some((entry) => entry.section === section))
    .map((section) =>
      [`## ${section}`, ...entries.filter((entry) => entry.section === section).map(renderEntry)].join("\n\n"),
    )
    .join("\n\n");
};

/** Writes `generateApiReference` output to `outputPath`, and reports whether that changed anything. */
export const writeApiReference = ({ entryPoint, tsconfigPath, outputPath }) => {
  const markdown = `${generateApiReference({ entryPoint, tsconfigPath })}\n`;
  if (fs.existsSync(outputPath) && fs.readFileSync(outputPath, "utf-8") === markdown) return false;
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, "utf-8");
  return true;
};
