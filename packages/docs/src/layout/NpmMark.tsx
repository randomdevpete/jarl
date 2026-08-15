import { ToolbarIcon } from "./Layout.styles";

export const NpmMark = ({ className }: { className?: string }) => (
  <ToolbarIcon viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474C23.214 24 24 23.214 24 22.237V1.763C24 .786 23.214 0 22.237 0Zm3.367 5.323 13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113Z"
    />
  </ToolbarIcon>
);

export default NpmMark;
