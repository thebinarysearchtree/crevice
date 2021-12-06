delete from user_areas
where
    id = $1 and
    organisation_id = $2
