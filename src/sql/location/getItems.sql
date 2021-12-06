select 
    id,
    name
from locations 
where organisation_id = $1
order by name asc
