select
    r.*,
    count(distinct ua.user_id) as user_count
from 
    roles r left join
    user_areas ua on ua.role_id = r.id
where r.organisation_id = $1
group by r.id
order by r.name asc
