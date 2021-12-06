select
    l.*,
    count(a.id) as area_count
from 
    locations l left join
    areas a on l.id = a.location_id
where l.organisation_id = $1
group by l.id
order by l.name asc
