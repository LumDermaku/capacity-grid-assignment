# Worklog

Running notes on how this got built — decisions, assumptions, dead ends, and anything
left unfinished. Append as you go; a line or two per entry is right.

---

## 2026-10-07: API and grid

### Data

- The assignments that look like duplicates aren't. Each person/project/date range has 15 rows: 14 with the same value and one with double it. Added up they give normal hours per day (2, 4, 5, 6 or 8), so I sum every row and treat `hours_per_day` as hours.
- My first query used `DISTINCT` and every number came out 3x too high. Keeping only the original row would leave one over-allocated cell in the whole dataset, which is also wrong.
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
