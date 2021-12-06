insert into shift_roles(
    series_id,
    role_id,
    capacity,
    organisation_id)
select $2, $3, $4, $5
from shift_roles
where
    series_id = $1 and
    organisation_id = $5
