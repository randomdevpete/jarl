import styled from "@emotion/styled";

const HelmetSvg = styled.svg`
  flex-shrink: 0;
  width: 1.6rem;
  height: 1.4rem;
`;

export const VikingHelmetMark = ({ className }: { className?: string }) => (
  <HelmetSvg viewBox="0 0 48 40" className={className} aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M24 2C13.4 2 7 10.4 7 21v10h12v5a2.5 2.5 0 0 0 2.5 2.5h5a2.5 2.5 0 0 0 2.5-2.5v-5h12V21C41 10.4 34.6 2 24 2ZM11 32v-5a4 4 0 0 1 8 0v5ZM29 32v-5a4 4 0 0 1 8 0v5Z"
    />
  </HelmetSvg>
);

export default VikingHelmetMark;
