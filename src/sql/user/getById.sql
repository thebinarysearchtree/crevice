select
    id,
    first_name,
    last_name,
    email,
    email_token
from users
where
    id = $1 and
    organisation_id = $2
