select
    u.id,
    concat_ws(' ', u.first_name, u.last_name) as name,
    r.id as role_id,
    r.name as role_name,
    u.image_id
from
    user_areas ua join
    roles r on ua.role_id = r.id join
    users u on ua.user_id = u.id
where
    concat_ws(' ', u.first_name, u.last_name) ilike $1 and
    ua.role_id = any(cast($3 as int[])) and
    ua.area_id = $2 and
    ua.start_time <= $4 and
    (ua.end_time is null or ua.end_time > $4) and
    not (u.id = any(cast($5 as int[]))) and
    u.organisation_id = $6
limit 5
