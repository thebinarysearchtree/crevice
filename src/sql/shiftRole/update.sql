update shift_roles
set capacity = $2
where
    id = $1 and
    organisation_id = $3
