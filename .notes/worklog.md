# Worklog

Running notes on how this got built — decisions, assumptions, dead ends, and anything
left unfinished. Append as you go; a line or two per entry is right.

---

## 2026-10-07: API and grid

### Data

- The assignments that look like duplicates aren't. Each person/project/date range has 15 rows: 14 with the same value and one with double it. Added up they give normal hours per day (2, 4, 5, 6 or 8), so I sum every row and treat `hours_per_day` as hours.
- My first query used `DISTINCT` and the numbers came out wrong (Dee's week of Jan 5 was 67.5h instead of 45h, 1.5x). Keeping only the original row would leave one over-allocated cell in the whole dataset, which is also wrong.
- Checked by hand: Dee Okafor, week of 2026-01-05, is 45h against 40. Eli Nakamura has 0 capacity and 20h allocated.
- Only Mon–Fri count. Assignments run over weekends, but weekends add nothing. No holidays.
- `weekly_hours` is a single current value, so editing it also changes past weeks. The proper fix is capacity with effective dates. The API already returns capacity per week, so that change wouldn't break the response.

### API

- Weeks start on Monday. The API widens `from`/`to` to whole weeks and returns the range it actually used.
- The range is capped at 26 weeks because production has thousands of people and two years of history. The query only reads assignments that overlap the range. 26 weeks for 500 people takes about 0.2s locally.
- Over-allocated means allocated > capacity. Any allocation against 0 capacity counts.
- I used pgx because it was already set up in `main.go`. sqlx wasn't worth adding for one query.
- `PATCH /api/people/{id}` takes `{"weekly_hours": n}` and returns the updated person. 400 for a bad id or body, 422 outside 0–168, 404 for an unknown id.
- 500s log the real error and return `"internal error"`, so database details stay out of the UI.

### Grid

- Saves are optimistic: the new capacity shows immediately, and the current range is refetched once the save finishes. If the save fails, only that person's old value is restored, so edits to other rows aren't lost.
- If a save fails, the input keeps what you typed and shows the error, and the grid goes back to the old numbers. Enter retries, Esc cancels.
- Found in the browser: the input was disabled while saving, which drops focus, so after a failure the keyboard did nothing. Changed it to read-only.
- Found in review: blur also called submit, so clicking away after a failure re-sent the failed PATCH. Now clicking away without editing sends nothing and keeps the error. Editing the value clears the error, so a corrected value saves on blur like any other edit. Enter still retries as-is.
- On first load it shows "Loading…". When changing weeks the old grid stays visible but dimmed. A failed load shows an error with a Retry button.

### Not done

- Paging or virtualization for thousands of rows.
- Capacity history, holidays and time off.
- A Go test for the query. Only checked by hand and with curl.

### Small extras, not in the brief

Not asked for, but cheap and I thought they helped. TanStack Query is covered above.

- Sticky header row and name column, so you keep your bearings when scrolling a big grid.
- Weeks with nothing allocated are dimmed, so the red cells stand out more.
- Hovering a red cell shows "Over by Xh".
- PATCH rejects bodies over 1 KB and unknown fields.
- A failed load retries once before showing the error, and the grid doesn't refetch every time the window gets focus.
- 500s return a generic "internal error" and log the real one (came out of code review).

### Tests

- Cut the suite from 7 tests to 3 to keep it small, as the brief asks. Kept the parts I'd be nervous to change: the 26-week cap moving the other end of the range, a failed save rolling back while keeping the typed value and focus, and blur after a failure (sends nothing until the value is corrected, then saves and the grid updates). Dropped the simple week-snapping tests and the plain successful-save test, which the blur test now covers.

### UI pass (Mantine)

- Added Mantine (core + dates) with a Toggl-style theme: plum top bar, violet accents, coral for over-allocation. Picked it because it's made for client-side SPAs, needs no Tailwind/PostCSS setup, and comes with date pickers.
- The grid is still a plain `<table>` with sticky header and name column. Mantine's Table would just wrap the same markup. Each week cell now has a thin utilisation bar, and the current week is highlighted.
- Kept a native number input (Mantine `Input`, not `NumberInput`) for editing, so the existing save/rollback tests and keyboard behaviour stay the same.
- Tests needed `matchMedia`/`ResizeObserver` stubs (`src/test-setup.ts`) and a `MantineProvider` wrapper.
- After adding deps, the web container must be restarted (`docker compose restart web`) so its `npm install` picks them up.
- Bug found after the restyle: the date picker's calendar was 1,000,034px wide and only the Monday column was visible. Cause: the grid's bare `table`/`th`/`td` CSS leaked into Mantine's calendar, which is also a `<table>`. Fixed by scoping every table rule under `.grid`. jsdom can't measure layout, so there's no unit test for this. I checked it in the browser by measuring the dropdown width.
- Swapped `DatePickerInput` for `DateInput` so dates can be typed as well as picked ("Nov 4, 2026" or ISO). Typed dates still snap to whole weeks via `normalizeRange`.

### TS/GraphQL rewrite

Branch `feat/rewrite-ts-graphql`, not the submission. Same behaviour and the same UI on Bun + GraphQL Yoga and React Router v8 (SPA) + Apollo Client 4.

- `api/Dockerfile` had to change (Go → `oven/bun`). The README forbids that on the submission; it's unavoidable here. Also added `api/.dockerignore` so the host's `node_modules` doesn't get copied over the image's. Compose, the Makefile, the schema and the seed are untouched.
- DB client is Bun's built-in `SQL`, not Drizzle. The schema is fixed SQL that must never be pushed or migrated, the main query is a raw CTE anyway, and tagged templates are parameterised. Drizzle (`drizzle-orm/bun-sql` with `pgTable`s mirroring `schema.sql`, no drizzle-kit) is the fallback if we want an ORM.
- The capacity SQL is Go's query, with the same `::float8` casts (Postgres `numeric` comes back as a string otherwise). It returns weeks as `YYYY-MM-DD` strings, not `Date`s, so no timezone off-by-one.
- Checked against Go on the same DB: 26 weeks from 2026-01-05 gives an identical response, 500 people and 484 of 13,000 person-weeks over (the handoff said 483; the DB has been edited since). ~0.19s warm on Bun, the same as Go's ~0.18–0.2s, so the `array_agg` speed-up wasn't needed.
- Schema: `CapacityRow { person: Person, allocated, capacity }` rather than the flat REST row, so Apollo normalises `Person` by id. A saved `Person` updates `weeklyHours` in every cached range on its own, and only `capacity[]` needs a manual `cache.modify`.
- Same validation messages as Go (the web shows them). `BAD_USER_INPUT` / `NOT_FOUND` codes. Unexpected errors go through Yoga's `maskError` as `internal error`, and the real error is logged with pino. A bad date is a `Date` scalar error ("must be a date (YYYY-MM-DD)"); it can't name the argument like Go did. Bodies over 8 KB get a 413.
- TanStack → Apollo, behaviour by behaviour:
  - keepPreviousData → `data ?? previousData`, dimmed while it's the previous range's data.
  - `retry: 1` → `RetryLink` that retries queries once (1s, like TanStack), never mutations.
  - AbortSignal on range changes → Apollo aborts a query when its last subscriber leaves. Seen in the browser: next ×3 aborts the stale request and only the latest range renders.
  - manual `previous` rollback → per-mutation optimistic layers; a failure drops only that save's layer. New test: a failed save on one row doesn't undo a pending save on another.
  - `isMutating() === 1` → a module-level pending-save counter; at 0, `refetchQueries([CapacityDocument])`.
  - `cancelQueries` → not needed: the optimistic layer sits above in-flight fetches until the save settles.
- Found in the browser: TanStack keeps a query's error while it refetches over data it already has, but Apollo clears it as the refetch starts. So on Retry the alert blinked off and the grid un-dimmed. `useCapacity` now keeps the last error during a same-range refetch over existing data. With no data, both libraries show the skeleton during Retry (TanStack resets to pending).
- The one deliberate difference: the range is in the URL (`?from=&to=`), so it's shareable and the back button works. Found in the browser: three quick "next week" clicks moved only one week, because router navigations commit asynchronously and each click saw the old range. `useRangeParam` keeps the last requested range until the URL catches up, so `setRange((prev) => …)` behaves as `useState` did.
- React Router 8 needs `react >= 19.2.7`, so React went from 19.2.0 to 19.2.7 (patch only). Mantine, dayjs and tabler stay at main's exact versions. React Router auto-installed `isbot` (its default server entry needs it), and that install pruned the dev deps once; reinstalled with them.
- `HydrateFallback` renders the same page chrome around the same skeleton, so the SPA's first paint is the loading state. Before hydration it can only show the default range; a `?from=&to=` URL shows its own dates once hydrated.
- Visual parity, checked against screenshots and DOM taken on main. `.card` outerHTML is byte-identical for the default view (500 rows, ids normalised), and so are the skeleton, the load-error card, the stale header with "Updating…", the failed-save row and the calendar popover (293px, 7 columns). Computed styles match except `72vh`, because the browser window couldn't be resized to the baseline's height. Differences left are not visual: no `#root` mount div, React's `<!--$-->` comments, and Mantine's empty portal node sits in a different place.
- Tests: `bun test` covers the range rules and row folding. A seeded-DB check of Dee's 45/40 runs inside the container (`docker compose exec api bun test`). Vitest ports both failed-save tests with the same assertions plus the concurrent-rollback test, using a real `ApolloClient` and a stubbed `fetch`.
- Codegen output is committed to the working tree (`api/src/generated`, `web/app/graphql/generated`): Docker never runs codegen, and the web container only mounts `./web`.
- From review: when a *new* range failed to load, the branch showed the alert over the old range's grid. Main shows the alert alone, because TanStack's placeholder data only applies while a query is pending (checked in query-core 5.104.1). Fixed: `useCapacity` drops `previousData` once the query has errored. Verified in the browser: stale grid while loading, alert alone after the failure, stale grid again during Retry.
- From review: errors are now masked even under `bun run dev` (`NODE_ENV=development` used to put the original error in `extensions`). Request logging only parses bodies that declare a length within the 8 KB limit. The health check returns `{"error":"internal error"}` and logs the real error; Go's 500 used to send the database message to the client.
- Left as is: `HydrateFallback` works out "this week" when it renders. Under `react-router dev` that happens on the server in UTC, so for the few hours after midnight on a Monday (local time), the fallback can show the previous week until hydration. A production `react-router build` would freeze the build date into `index.html`; Compose only runs dev.
- Found by hand, cancelled requests in the Network tab: a single range change sometimes sent several requests, flipping between the new range and the old one, each aborting the other (up to 9 per click, each after ~250ms of server work). Cause: React Router renders navigations as transitions, and Apollo's `useQuery` switches its query to new variables *during render*. When React abandons the transition render (a response arriving forces an urgent re-render of the still-committed old range), that re-render switches the query back. `flushSync` on the navigation didn't help. Fix: `useQuery` only gets a range after it has been committed (`useCommittedVariables`, set in a layout effect). Measured in the browser: from 3–16 bad clicks per run to 0 of 46. Regression test `app/lib/capacity.test.tsx` holds a transition open with a suspending sibling; without the fix it sees 35 flipping requests in 50ms.
- API image now has a builder stage on `oven/bun:1.4.2-alpine` which installs prod deps and runs `bun build --minify --bytecode` into `dist/`, and the runtime stage runs `bun dist/index.js`. The schema `.graphql` files are read from `src/models` at startup (resolved from the working directory), so the runtime copies that folder. `bun run dev` and `bun test` are unchanged. The runtime image has no tests any more, so run the seeded-DB test from the builder stage: `docker build --target builder -t capacity-api-test api && docker run --rm --network capacity-grid-assignment_default -e 'DATABASE_URL=postgres://capacity:capacity@db:5432/capacity?sslmode=disable' capacity-api-test bun test`.
