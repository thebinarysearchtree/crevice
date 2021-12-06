update users
set failed_password_attempts = 0
where id = $1
