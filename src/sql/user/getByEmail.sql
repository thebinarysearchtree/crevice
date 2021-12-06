select 
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.password,
    u.refresh_token,
    u.is_admin,
    u.is_disabled,
    u.is_verified,
    u.failed_password_attempts,
    u.organisation_id,
    coalesce(json_agg(json_build_object(
        'id', a.area_id, 
        'role_id', a.role_id,
        'is_admin', a.is_admin)) filter (where a.area_id is not null), json_build_array()) as areas
from 
    users u left join
    user_areas a on 
    a.user_id = u.id and
    a.start_time <= now() and
    (a.end_time is null or a.end_time > now())
where
    u.email = $1 and
    u.is_disabled is false and
    u.is_verified is true
group by u.id
