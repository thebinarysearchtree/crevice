update shifts
set series_id = $2
where
    id = $1 and
    organisation_id = $3
