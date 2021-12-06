update roles
set 
    name = $2,
    colour = $3,
    cancel_before_minutes = $4,
    book_before_minutes = $5
where
    id = $1 and
    organisation_id = $6
