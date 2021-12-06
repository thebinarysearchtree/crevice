select
    a.*,
    l.name as location_name,
    coalesce(json_agg(json_build_object(
        'id', u.id,
        'name', concat_ws(' ', u.first_name, u.last_name),
        'image_id', u.image_id)) filter (where ua.is_admin is true), json_build_array()) as administrators,
    count(ua.user_id) as active_user_count
from 
    areas a join
    locations l on l.id = a.location_id left join
    user_areas ua on 
        a.id = ua.area_id and
        ua.start_time <= now() and
        (ua.end_time is null or ua.end_time > now()) left join
    users u on ua.user_id = u.id
where a.organisation_id = $1
group by a.id, l.name
order by l.name asc, a.name asc
