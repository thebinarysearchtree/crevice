select 
    a.id, 
    l.time_zone
from
    areas a join
    locations l on a.location_id = l.id
where a.organisation_id = $1
order by l.name asc, a.name asc
limit 1
