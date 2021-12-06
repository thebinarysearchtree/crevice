update users
set 
    failed_password_attempts = failed_password_attempts + 1,
    is_disabled = case when 
        (failed_password_attempts + 1) = 5 then true
        else is_disabled end
where
    id = $1 and
    is_disabled is false
