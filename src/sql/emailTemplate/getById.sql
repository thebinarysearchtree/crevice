select
    subject,
    html,
    plaintext
from email_templates
where
    ($4 is true or id = $1) and
    type = $2 and
    organisation_id = $3 and
    ($5 is true or is_default is true)
