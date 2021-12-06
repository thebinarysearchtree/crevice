insert into shift_series(
    is_single,
    notes,
    created_by,
    question_group_id,
    organisation_id)
select 
    true, 
    notes, 
    created_by,
    question_group_id,
    organisation_id
from shift_series
where
    id = $1 and
    organisation_id = $2
returning id
