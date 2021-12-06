update locations
set
    name = $2,
    time_zone = $3,
    address = $4
where
    id = $1 and
    organisation_id = $5
