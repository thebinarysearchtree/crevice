insert into user_fields(
    user_id,
    field_id,
    item_id,
    text_value,
    date_value,
    organisation_id)
select $1, $2, $3, $4, $5, $6
where 
    ($3 is null or exists(
        select 1 from field_items 
        where
            id = $3 and
            field_id = $2 and
            organisation_id = $6))
