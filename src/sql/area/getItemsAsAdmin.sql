select id, name
from areas 
where organisation_id = $1
order by name desc
