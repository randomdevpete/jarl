import styled from "@emotion/styled";
import { Link } from "jarl-react";
import { theme } from "../theme";

const contentWidth = "960px";

export const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const SiteHeader = styled.header`
  border-bottom: 1px solid ${theme.border};
  background: ${theme.bgAlt};
  position: sticky;
  top: 0;
  z-index: 10;
`;

export const SiteHeaderInner = styled.div`
  max-width: ${contentWidth};
  margin: 0 auto;
  padding: 0.9rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
`;

export const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: ${theme.fontHeading};
  font-weight: 400;
  font-size: 1.3rem;
  letter-spacing: 0.06em;
  color: ${theme.accent};

  &:hover {
    text-decoration: none;
    color: ${theme.accentStrong};
  }
`;

export const MainNav = styled.nav`
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;

  a {
    color: ${theme.fgMuted};
    font-size: 0.95rem;
  }

  a:hover,
  a[data-active] {
    color: ${theme.accent};
    text-decoration: none;
  }
`;

export const SiteMain = styled.main`
  flex: 1;
  max-width: ${contentWidth};
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.25rem 4rem;
`;

export const SiteFooter = styled.footer`
  border-top: 1px solid ${theme.border};
  padding: 1.5rem;
  text-align: center;
  color: ${theme.fgMuted};
  font-size: 0.85rem;
`;
