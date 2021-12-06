update users
set
    email_token = $2,
    email_token_expiry = now() + interval '1 day'
where
    email = $1 and
    is_disabled is false
returning 
    id, 
    first_name
