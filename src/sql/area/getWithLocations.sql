select
    l.id,
    l.name,
    json_agg(json_build_object(
        'id', a.id,
        'name', a.name,
        'time_zone', l.time_zone) order by a.name asc) as areas
from
    areas a join
    locations l on a.location_id = l.id
where a.organisation_id = $1
group by l.id
order by l.name asc
