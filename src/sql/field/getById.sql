select 
    f.*,
    json_agg(json_build_object(
        'id', i.id, 
        'name', i.name, 
        'item_number', i.item_number) order by i.item_number asc) as select_items
from 
    fields f left join
    field_items i on i.field_id = f.id
where
    f.id = $1 and
    f.organisation_id = $2
group by f.id
