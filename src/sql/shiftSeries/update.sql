update shift_series
set 
    notes = $2,
    question_group_id = $3
where
    id = $1 and
    organisation_id = $4 and
    (cast($3 as int) is null or exists(
        select 1 from question_groups
        where
            id = $3 and
            organisation_id = $4))
