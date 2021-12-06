update organisations
set 
    name = $1,
    logo_image_id = $2
where id = $3
