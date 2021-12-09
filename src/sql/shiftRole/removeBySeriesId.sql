delete from shift_roles
where
    series_id = $1 and
    role_id = $2 and
    organisation_id = $3
