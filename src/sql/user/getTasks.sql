select 
    not exists (select 1 from roles where organisation_id = $1) as needs_roles,
    not exists (select 1 from locations where organisation_id = $1) as needs_locations,
    not exists (select 1 from areas where organisation_id = $1) as needs_areas,
    not exists (select 1 from user_roles where organisation_id = $1) as needs_users
    