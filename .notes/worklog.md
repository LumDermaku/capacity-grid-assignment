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

### Grid

- Saves are optimistic: the new capacity shows immediately, and the current range is refetched once the save finishes. If the save fails, only that person's old value is restored, so edits to other rows aren't lost.
- If a save fails, the input keeps what you typed and shows the error, and the grid goes back to the old numbers. Enter retries, Esc cancels.
- Found in the browser: the input was disabled while saving, which drops focus, so after a failure the keyboard did nothing. Changed it to read-only.
- On first load it shows "Loading…". When changing weeks the old grid stays visible but dimmed. A failed load shows an error with a Retry button.

### Not done

- Paging or virtualization for thousands of rows.
- Capacity history, holidays and time off.
- A Go test for the query. Only checked by hand and with curl.
