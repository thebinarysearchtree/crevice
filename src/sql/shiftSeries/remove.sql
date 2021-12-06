delete from shift_series
where
    id = $1 and
    organisation_id = $2
