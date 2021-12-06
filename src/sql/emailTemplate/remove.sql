delete from email_templates
where
    id = $1 and
    organisation_id = $2
