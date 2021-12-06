update shift_roles
set capacity = $3
where
    series_id = $1 and
    role_id = $2 and
    organisation_id = $4
