select
    id,
    concat_ws(' ', first_name, last_name) as name,
    image_id
from users
where
    concat_ws(' ', first_name, last_name) ilike $1 and
    organisation_id = $2
limit 5
