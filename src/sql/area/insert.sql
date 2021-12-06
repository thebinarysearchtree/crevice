insert into areas(
    name,
    location_id,
    notes,
    organisation_id)
select $1, $2, $3, $4
where exists(
    select 1 from locations
    where
        id = $2 and
        organisation_id = $4)
