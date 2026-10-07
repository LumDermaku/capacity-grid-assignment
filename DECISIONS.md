# Decisions

This branch is the same capacity view rebuilt on the stack I'm more comfortable with: Bun + GraphQL Yoga for the API, React Router (SPA mode) + Apollo Client for the web. main is the version I submitted. The goal here was the same behaviour and the same UI, so most of this file is about what changed and what broke on the way.

## What changed compared to main

- API is Bun + GraphQL Yoga instead of Go. One query `capacity(from, to)` and one mutation `updateWeeklyHours`. `/api/health` stays a plain REST route because the README points to it
- Same SQL as the Go version, run with Bun's built-in Postgres client. No ORM, the schema is fixed SQL files and the main query is a raw CTE anyway
- Same numbers. 26 weeks from Jan 5 gives the exact same response as Go.
- Same validation and the same error messages, because the UI shows them. Unexpected errors still go out as "internal error" and the real one is logged
- Web is Apollo instead of TanStack Query. Mantine, theme, CSS and the grid markup are copied over. I compared screenshots and the grid HTML against main for every state (default, loading, updating, failed save, load error, calendar) and they match
- Response shape is different. Each row has a `person { id, name, weeklyHours }` instead of flat fields, so Apollo stores every person once by id. After a save, weekly hours update everywhere by themselves and only the per-week capacity has to be patched by hand. With TanStack I had to patch every cached range and roll back by hand
- The date range is now in the URL (`?from=&to=`), so it can be shared and the back button works. That's the one change on purpose
- Types for both sides come from codegen off the GraphQL schema
- Run environment: only `api/Dockerfile` had to change, there is no way around that for a different runtime. Compose and the Makefile are the same.

## What did the spec not tell you?

Same decisions as main, they still hold:

- What hours_per_day means. Each person/project/date range has 15 rows that add up to normal hours per day, so I sum all of them. Dee Okafor in the week of Jan 5 comes out at 45h against 40h
- What a week is. Monday to Sunday, only weekdays count, the range is widened to whole weeks
- What over-allocated means. Allocated strictly more than capacity. Work against 0 capacity counts, thats why Eli Nakamura is red
- Capacity has no history, so editing weekly hours changes past weeks too. Capacity is still returned per week so dated capacity can come later
- Scale. Ranges over 26 weeks are refused
- How the grid stays right after a save. Still optimistic. Apollo shows the new value straight away, and if the save fails it drops only that save, so other rows being edited at the same time keep their values. The visible range is refetched once the last save finishes
- Failed save and loading states work exactly like main

## What broke during the port

All of these came from Apollo and React Router behaving differently from TanStack and useState. None of them exist in main, I checked by running tests for each one against main's code.

- One click on next week sometimes sent several requests that cancelled each other, flipping between the new and the old range (up to 9 per click). React Router renders navigations in a way React can throw away, and Apollo switches its query while rendering, so the old range kept switching it back. Fixed by giving Apollo the range only after the screen has actually updated. There is a test for it
- Three quick clicks on next week moved only one week. The URL updates a bit later than useState did, so each click saw the old range. Fixed by remembering the last range asked for
- On Retry, the error disappeared while it was retrying. TanStack keeps the error up, Apollo clears it, so I changed it back to match main
- When a new range failed to load, the error showed on top of the old grid. In main you only see the error. Fixed to match

## What did the AI get wrong that you caught?

- Same one as main: it wanted to deduplicate the repeated assignment rows, which gave 67.5h instead of 45h for Dee ... (forgot the last name)
- On this branch: its first version of the range-in-URL caused the cancelled-request back-and-forth above. I spotted the cancelled requests in the network tab. Its first fix (making the navigation synchronous) didn't help, it only worked once we found that Apollo changes the query during render

## What would you do differently with a week?

- Capacity with start dates, so editing it doesn't rewrite history
- Paging or virtualized rows. Re-rendering all 500 rows takes around 450ms in dev mode, which is also why the request back-and-forth above showed up so easily
- Try Apollo's Suspense hooks, they are built to work with React's transitions instead of around them
- More API tests with a small fixture. Right now `bun test` covers the range rules and one check against the seeded DB
- Check the query plan on two years of production sized data
- Holidays and time off lowering capacity
- Tell the user when their range gets cut to 26 weeks
