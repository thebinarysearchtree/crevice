insert into shift_series(
    is_single,
    notes,
    created_by,
    question_group_id,
    organisation_id)
select $1, $2, $3, $4, $5
where ($4 is null or exists(
    select 1 from question_groups
    where
    id = $4 and
    organisation_id = $5
))
returning id
