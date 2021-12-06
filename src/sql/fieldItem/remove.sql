delete from field_items
where
    id = $1 and
    organisation_id = $2
