select 
    a.id,
    a.name,
    l.time_zone,
    json_agg(json_build_object(
        'id', ua.id,
        'role_id', ua.role_id,
        'role_name', r.name,
        'role_colour', r.colour,
        'start_time', ua.start_time at time zone l.time_zone,
        'end_time', ua.end_time at time zone l.time_zone,
        'is_admin', ua.is_admin) order by ua.start_time asc) as periods
from 
    user_areas ua join
    roles r on ua.role_id = r.id join
    areas a on ua.area_id = a.id join
    locations l on a.location_id = l.id
where
    ua.user_id = $1 and
    ua.organisation_id = $2
group by a.id, l.time_zone
order by name asc
