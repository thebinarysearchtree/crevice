insert into email_templates(
    type,
    name,
    subject,
    slate,
    html,
    plaintext,
    is_default,
    organisation_id)
values($1, $2, $3, $4, $5, $6, $7, $8)
returning id
