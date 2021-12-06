with items_query as (
    select
        field_id,
        json_agg(json_build_object(
            'id', id,
            'name', name,
            'item_number', item_number) order by item_number asc) as select_items
    from field_items
    group by field_id
), fields_query as (
    select
        f.id,
        f.name,
        f.field_type,
        f.field_number,
        count(uf.id) as user_count
    from
        fields f left join
        user_fields uf on uf.field_id = f.id left join
        users u on uf.user_id = u.id
    where f.organisation_id = $1
    group by f.id
    order by f.field_number asc
)
select
    f.*,
    coalesce(i.select_items, json_build_array()) as select_items
from
    fields_query f left join
    items_query i on f.id = i.field_id
order by f.field_number asc
