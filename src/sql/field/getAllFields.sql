select 
    f.*,
    json_agg(json_build_object(
        'id', i.id, 
        'name', i.name) order by i.item_number asc) as select_items
from 
    fields f left join
    field_items i on i.field_id = f.id
where f.organisation_id = $1
group by f.id
order by f.field_number asc
