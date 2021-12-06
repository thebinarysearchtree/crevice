update field_items
set
    name = $2,
    item_number = $3
where
    id = $1 and
    organisation_id = $4
