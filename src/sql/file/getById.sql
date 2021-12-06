select * from files
where
    id = $1 and
    organisation_id = $2
