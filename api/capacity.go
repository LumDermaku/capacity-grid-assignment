package main

import (
	"net/http"
	"time"
)

const (
	dateLayout = "2006-01-02"
	maxWeeks   = 26
)

type capacityResponse struct {
	From   string           `json:"from"`
	To     string           `json:"to"`
	Weeks  []string         `json:"weeks"`
	People []personCapacity `json:"people"`
}

// Allocated and Capacity are hours, index-aligned with capacityResponse.Weeks.
type personCapacity struct {
	ID          int       `json:"id"`
	Name        string    `json:"name"`
	WeeklyHours float64   `json:"weekly_hours"`
	Allocated   []float64 `json:"allocated"`
	Capacity    []float64 `json:"capacity"`
}

// Rows that look like duplicates are additive: summed, they give whole hours
// per day, so they must not be deduplicated. Weekends never count.
const capacityQuery = `
WITH weeks AS (
	SELECT generate_series($1::date, $2::date, interval '7 days')::date AS week_start
),
alloc AS (
	SELECT a.person_id, date_trunc('week', d)::date AS week_start, sum(a.hours_per_day) AS hours
	FROM assignments a
	CROSS JOIN generate_series(greatest(a.start_date, $1::date), least(a.end_date, $2::date), interval '1 day') AS d
	WHERE a.start_date <= $2 AND a.end_date >= $1 AND extract(isodow FROM d) < 6
	GROUP BY 1, 2
)
SELECT p.id, p.name, p.weekly_hours::float8, w.week_start, round(coalesce(alloc.hours, 0), 2)::float8
FROM people p
CROSS JOIN weeks w
LEFT JOIN alloc ON alloc.person_id = p.id AND alloc.week_start = w.week_start
ORDER BY p.name, p.id, w.week_start`

// handleCapacity serves GET /api/capacity?from=YYYY-MM-DD&to=YYYY-MM-DD.
// The range is widened to whole ISO weeks (Monday to Sunday).
func (s *server) handleCapacity(w http.ResponseWriter, r *http.Request) {
	from, err := time.Parse(dateLayout, r.URL.Query().Get("from"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "from must be a date (YYYY-MM-DD)")
		return
	}
	to, err := time.Parse(dateLayout, r.URL.Query().Get("to"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "to must be a date (YYYY-MM-DD)")
		return
	}
	if to.Before(from) {
		writeError(w, http.StatusBadRequest, "from must not be after to")
		return
	}
	from = mondayOf(from)
	to = mondayOf(to).AddDate(0, 0, 6)
	weekCount := int(to.Sub(from).Hours()/24+1) / 7
	if weekCount > maxWeeks {
		writeError(w, http.StatusBadRequest, "range is limited to 26 weeks")
		return
	}

	rows, err := s.db.Query(r.Context(), capacityQuery, from, to)
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	defer rows.Close()

	resp := capacityResponse{
		From:   from.Format(dateLayout),
		To:     to.Format(dateLayout),
		Weeks:  make([]string, 0, weekCount),
		People: []personCapacity{},
	}
	for i := range weekCount {
		resp.Weeks = append(resp.Weeks, from.AddDate(0, 0, 7*i).Format(dateLayout))
	}

	var p *personCapacity
	for rows.Next() {
		var (
			id          int
			name        string
			weeklyHours float64
			week        time.Time
			allocated   float64
		)
		if err := rows.Scan(&id, &name, &weeklyHours, &week, &allocated); err != nil {
			writeError(w, http.StatusInternalServerError, err.Error())
			return
		}
		if p == nil || p.ID != id {
			resp.People = append(resp.People, personCapacity{
				ID:          id,
				Name:        name,
				WeeklyHours: weeklyHours,
				Allocated:   make([]float64, 0, weekCount),
				Capacity:    make([]float64, 0, weekCount),
			})
			p = &resp.People[len(resp.People)-1]
		}
		p.Allocated = append(p.Allocated, allocated)
		p.Capacity = append(p.Capacity, weeklyHours)
	}
	if err := rows.Err(); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

func mondayOf(t time.Time) time.Time {
	return t.AddDate(0, 0, -((int(t.Weekday()) + 6) % 7))
}
