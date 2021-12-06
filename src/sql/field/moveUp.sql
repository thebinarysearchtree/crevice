with update_result as (
    update fields
    set field_number = field_number - 1
    where
        id = $1 and
        organisation_id = $2 and
        field_number > 1
    returning field_number)
update fields
set field_number = (select field_number + 1 from update_result)
where
    id != $1 and
    organisation_id = $2 and
    field_number = (select field_number from update_result)
