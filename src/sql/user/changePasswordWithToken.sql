update users
set 
    password = $3,
    email_token = null,
    email_token_expiry = null,
    is_verified = true
where
    id = $1 and
    email_token = $2 and
    email_token_expiry > now() and
    is_disabled is false
