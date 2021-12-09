update users u
set image_id = $1
where
    ($2 = 'email' or $2 = 'phone') and
    ($2 != 'email' or u.email = $3) and
    ($2 != 'phone' or (u.phone = $3 and $3 is not null)) and
    ($4 is false or u.image_id is null) and
    u.organisation_id = $5
