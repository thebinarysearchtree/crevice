update users
set 
    is_verified = true,
    email_token = null,
    email_token_expiry = null
where
    id = $1 and
    is_disabled is false and
    is_verified is false and
    email_token is not null and
    email_token = $2 and
    email_token_expiry > now()
