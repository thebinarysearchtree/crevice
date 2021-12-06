insert into users(
    first_name,
    last_name,
    email,
    password,
    refresh_token,
    email_token,
    is_admin,
    image_id,
    phone,
    pager,
    organisation_id)
values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
returning id
