select * from locations
where 
    id = $1 and 
    organisation_id = $2
