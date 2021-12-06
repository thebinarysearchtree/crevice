select 
    a.id, 
    a.name
from
    user_areas ua join
    areas a on ua.area_id = a.id 
where 
    ua.user_id = $1 and
    ua.organisation_id = $2 and
    ua.is_admin is true and
    ua.start_time <= now() and (ua.end_time > now() or ua.end_time is null)
order by a.name desc
