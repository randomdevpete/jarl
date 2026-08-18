import styled from "@emotion/styled";
import { theme } from "../theme";

/** Plain styling, split out of DataGridApp.tsx so it doesn't stand between the reader and the
 * routing/state story that demo exists to tell. */
export const Table = styled.table`
  border-collapse: collapse;
  width: 100%;

  th,
  td {
    text-align: left;
    padding: 0.4rem 0.75rem;
    border-bottom: 1px solid ${theme.border};
  }

  th button {
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
  }
`;
