insert into shifts(
    area_id,
    start_time,
    end_time,
    break_minutes,
    series_id,
    organisation_id)
select $1, $2, $3, $4, $5, $6
where 
    cast($3 as timestamptz) > cast($2 as timestamptz) and
    exists(
        select 1 from areas
        where
            id = $1 and
            organisation_id = $6) and
    exists(
        select 1 from shift_series
        where
            id = $5 and
            organisation_id = $6)
returning id
