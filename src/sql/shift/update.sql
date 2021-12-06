update shifts
set
    start_time = start_time + (cast($4 as timestamptz) - cast($2 as timestamptz)),
    end_time = end_time + (cast($5 as timestamptz) - cast($3 as timestamptz)),
    break_minutes = $6
where
    series_id = $1 and
    organisation_id = $7 and
    cast($5 as timestamptz) > cast($4 as timestamptz)