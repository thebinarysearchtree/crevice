update users u
set image_id = $1
from 
    user_fields uf,
    fields f
where
    uf.user_id = u.id and
    uf.field_id = f.id and
    f.name = $2 and
    uf.text_value = $3 and
    ($4 is false or u.image_id is null) and
    u.organisation_id = $5
