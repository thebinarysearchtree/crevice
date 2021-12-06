insert into fields(
    name,
    field_type,
    field_number,
    organisation_id)
select $1, $2, coalesce(max(field_number), 0) + 1, $3
from fields
where organisation_id = $3
returning id
