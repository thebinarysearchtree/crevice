with areas_query as (
    select
        ua.user_id,
        json_agg(distinct r.name) as roles,
        json_agg(distinct a.name) as areas
    from
        user_areas ua join
        roles r on ua.role_id = r.id join
        areas a on ua.area_id = a.id
    where
        ua.user_id = $1 and
        ua.start_time <= now() and
        (ua.end_time is null or ua.end_time > now())
    group by ua.user_id
), users_query as (
    select
        u.id as user_id,
        concat_ws(' ', u.first_name, u.last_name) as name,
        u.email,
        u.phone,
        u.pager,
        u.image_id,
        coalesce(json_agg(json_build_object(
            'field_name', f.name,
            'item_name', fi.name,
            'text_value', uf.text_value,
            'date_value', uf.date_value) order by f.field_number asc) filter (where f.id is not null), json_build_array()) as fields
    from
        users u left join
        user_fields uf on uf.user_id = u.id left join
        fields f on uf.field_id = f.id left join
        field_items fi on uf.item_id = fi.id
    where 
        u.id = $1 and 
        u.organisation_id = $2
    group by u.id
)
select
    uq.*,
    coalesce(aq.roles, json_build_array()) as roles,
    coalesce(aq.areas, json_build_array()) as areas
from
    users_query uq left join
    areas_query aq on uq.user_id = aq.user_id
