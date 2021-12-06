insert into files(
    id,
    filename,
    original_name,
    size_bytes,
    mime_type,
    uploaded_by,
    organisation_id)
values($1, $2, $3, $4, $5, $6, $7)
