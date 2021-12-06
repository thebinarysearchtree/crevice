select
    id,
    name,
    field_type
from fields
where organisation_id = $1
order by field_number asc
