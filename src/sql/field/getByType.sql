select * from fields
where 
    organisation_id = $2 and
    field_type = any(cast($1 as text[]))
