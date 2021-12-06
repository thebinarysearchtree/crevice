update fields
set 
    name = $2
where
    id = $1 and
    organisation_id = $3
