# Hooks & Links

The [Getting Started](/docs/getting-started) guide covers the basic shape of `Link`. This page
covers the hooks it's built from - useful directly whenever the UI you need isn't literally a
`<Route>`/`<a>` pair - and `Link`'s fuller surface.

## The hooks

`jarl-react`'s hooks are all thin wrappers over `useAtom`/`useAtomValue`/`useSetAtom` for a route
atom, named for what they're for rather than what they do under the hood:

- **`useRoute(routeAtom)`** - the route's current match state (`match`, `exact`, `values`,
  `reverse`). Equivalent to `useAtomValue(routeAtom)`.
- **`useIsActive(routeAtom, { exact? })`** - just the boolean, for nav-highlighting logic that
  doesn't need the rest of the match state.
- **`useHref(routeAtom, values)`** - reverses `values` into a URL string, without a click handler.
  Useful for a canonical `<link>` tag, a share URL, or a prefetch `href` that isn't a nav link.
- **`useNavigate(routeAtom)`** - a stable `navigate(values)` function for imperative navigation
  outside of rendering a link, e.g. after a form submits:

  ```tsx
  const navigate = useNavigate(productRoute);

  const onSubmit = async (form: FormData) => {
    const { id } = await createProduct(form);
    navigate({ productId: id });
  };
  ```

  `navigate` always pushes. For a `replace` navigation, use `useSetAtom(routeAtom)` directly and
  pass `{ replace: true }` as its second argument.

- **`useLink(routeAtom, values, { exact? })`** - what `Link` itself is built on: `href`, `active`
  and an `onClick` handler in one call, for link-like UI that isn't an `<a>` - a styled `<div>`
  card that navigates on click, for instance.

`useHref` and `useLink` both still subscribe to `routeAtom`, since `reverse()` can depend on
ancestor route state - so a component using either re-renders on navigation even when the `href`
it computes doesn't change.

## `Link`'s fuller surface

Beyond `route`/`to`, `Link` takes:

- **`exact`** - only report itself `active` (see below) for an exact match, not an ancestor one.
- **`activeClassName`** - appended to `className` while active.
- **`element`** - render as something other than `<a>` (ignored when `children` is a function).
- Any standard anchor attribute, forwarded straight through.

Whether a link is "active" is also exposed as a `data-active` attribute (present only when active,
so `a[data-active] { ... }` styling doesn't need `activeClassName` plumbed through at all), and to
the function-as-child form:

```tsx
<Link route={productRoute} to={{ productId: "123" }}>
  {({ href, active, onClick }) => (
    <CustomLink href={href} onClick={onClick} highlighted={active}>
      Our Best Product Ever!
    </CustomLink>
  )}
</Link>
```

`onClick` here already calls `event.preventDefault()` before navigating - pass it straight to the
underlying element as-is.
