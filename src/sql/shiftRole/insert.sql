insert into shift_roles(
    series_id,
    role_id,
    capacity,
    organisation_id)
select $1, $2, $3, $4
where
    exists(
        select 1 from shift_series
        where
            id = $1 and
            organisation_id = $4) and
    exists(
        select 1 from roles
        where
            id = $2 and
            organisation_id = $4) and
    not exists(
        select 1 from shift_roles
        where
            series_id = $1 and
            role_id = $2)
returning id
