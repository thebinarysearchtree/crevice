update areas
set
    name = $2,
    location_id = $3,
    notes = $4
where
    id = $1 and
    organisation_id = $5 and
    exists(
        select 1 from locations
        where
            id = $3 and
            organisation_id = $5)
