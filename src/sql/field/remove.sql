with delete_result as (
    delete from fields
    where
        id = $1 and
        organisation_id = $2
    returning field_number)
update fields
set field_number = field_number - 1
where
    organisation_id = $2 and
    field_number > (select field_number from delete_result)
