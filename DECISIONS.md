# Decisions

Yours to write, not your AI's. Short is good — bullets are fine, and half a page is
plenty. We read this first.

## What did the spec not tell you?

There are things this brief doesn't specify. Which ones did you hit, what did you decide,
and why?

- What hours_per_day means. Each person/project/date range has 15 rows that add up to normal hours per day, so I sum all of them and treat the value as hours. Deduplicating would be wrong. Dee Okafor in the week of Jan 5 comes out at 45h against 40h
- What a week is. I went with Monday to Sunday and only weekdays count. The API widens the range to whole weeks and the date fields snap the same way, so you never see half a week
- What over-allocated means. Allocated strictly more than capacity. Work against 0 capacity counts too, thats why Eli Nakamura is red
- Capacity has no history. weekly_hours is one number, so editing it changes past weeks too. I accepted that for now, the API already returns capacity per week so dated capacity can come later without changing the response
- Scale. Production has thousands of people and two years of data, so ranges over 26 weeks are refused. 500 people over 26 weeks takes about 0.2s
- How the grid stays right after a save. Its optimistic, the new capacity shows straight away and the range is refetched once the last save finishes. I did it this way because the edit only changes one persons capacity, so the client already knows the result
- What a failed save looks like. That persons numbers go back, the input keeps what you typed and shows the server error under it. Enter retries, Esc cancels
- Loading. First load shows placeholder rows. When changing weeks the old grid stays on screen dimmed until the new data arrives. A failed load shows an error with Retry

## What did you notice that looked wrong?

Anything in the output that didn't match what you expected. Whether you fixed it or left
it, we want to know you saw it.

- 126,195 assignment rows but only 16,826 distinct ones. Looked like a bad import at first, but its the 15 row pattern above
- User Eli Nakamura has 0 weekly hours but still has assignments. I left it and the grid shows Eli as over, which I think is right
- Two different people are both called "田中 陽子", so everything is keyed by id and not by name
- Editing capacity rewrites past weeks because there is no history. Noticed it, didnt fix it
- As a sanity check 3.7% of person-weeks are over for 26 weeks from Jan 5. Few enough that the red actually stands out

## What did the AI get wrong that you caught?

One concrete example. Every real session has one.

- It misread the data. It suggested deduplicating the repeated assignment rows, and the first query did that, so Dee's week of Jan 5 came out at 67.5h instead of 45h. I caught it by working the numbers out by hand and comparing

## What would you do differently with a week?

- Capacity with start dates, so editing it doesn't rewrite history
- Paging or virtualized rows for thousands of people, plus sorting on the server with over-allocated first
- A Go test for the capacity query with a small fixture, right now its only checked by hand and with curl
- Check the query plan on two years of production sized data
- Holidays and time off lowering capacity
- Tell the user when their range gets cut to 26 weeks, right now it happens silently
