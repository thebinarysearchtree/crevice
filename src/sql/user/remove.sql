delete from users
where 
    id = $1 and
    is_admin is false and
    organisation_id = $2
