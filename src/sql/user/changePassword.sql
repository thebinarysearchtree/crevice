update users 
set 
    password = $1, 
    refresh_token = $2
where id = $3
