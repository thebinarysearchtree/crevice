select 
    id,
    name,
    colour
from roles 
where organisation_id = $1
order by name desc
