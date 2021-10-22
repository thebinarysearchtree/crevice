create table organisations (
    id serial primary key,
    name text not null,
    created_at timestamptz not null default now(),
    logo_image_id uuid
);

create table email_templates (
    id serial primary key,
    type text not null check (type in (
        'SignUp',
        'Invite',
        'LostPassword'
    )),
    name text not null,
    subject text not null,
    slate json not null,
    html text not null,
    plaintext text not null,
    is_default boolean not null,
    organisation_id integer not null references organisations on delete cascade
);

create index email_templates_organisation_id_index on email_templates(organisation_id);

create table users (
    id serial primary key,
    first_name text not null,
    last_name text not null,
    email text not null unique,
    password text not null,
    refresh_token uuid not null,
    email_token uuid,
    email_token_expiry timestamptz default now() + interval '7 days',
    created_at timestamptz not null default now(),
    is_admin boolean not null,
    is_disabled boolean not null default false,
    is_verified boolean not null default false,
    failed_password_attempts integer not null default 0,
    image_id uuid,
    phone text,
    pager text,
    organisation_id integer not null references organisations on delete cascade
);

create table followers (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    following_user_id integer not null references users on delete cascade,
    organisation_id integer not null references organisations on delete cascade,
    unique(user_id, following_user_id)
);

create table roles (
    id serial primary key,
    name text not null,
    colour text not null,
    cancel_before_minutes integer not null,
    book_before_minutes integer not null,
    can_book_and_cancel boolean not null,
    created_at timestamptz not null default now(),
    organisation_id integer not null references organisations on delete cascade
);

create index roles_organisation_id_index on roles(organisation_id);

create table files (
    id uuid primary key,
    filename text not null,
    original_name text not null,
    size_bytes integer not null,
    mime_type text not null,
    uploaded_by integer not null references users on delete cascade,
    uploaded_at timestamptz not null default now(),
    organisation_id integer not null references organisations on delete cascade
);

create index files_organisation_id_index on files(organisation_id);

create table user_files (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    file_id uuid not null references files on delete cascade,
    organisation_id integer not null references organisations on delete cascade
);

create index user_files_user_id_index on user_files(user_id);

create table locations (
    id serial primary key,
    name text not null,
    time_zone text not null,
    address text,
    created_at timestamptz not null default now(),
    organisation_id integer not null references organisations on delete cascade
);

create index locations_organisation_id_index on locations(organisation_id);

create table areas (
    id serial primary key,
    name text not null,
    location_id integer not null references locations on delete cascade,
    notes text,
    address text,
    created_at timestamptz not null default now(),
    organisation_id integer not null references organisations on delete cascade
);

create index areas_location_id_index on areas(location_id);
create index areas_organisation_id_index on areas(organisation_id);

create table fields (
    id serial primary key,
    name text not null,
    field_type text not null check (field_type in (
        'Short',
        'Standard',
        'Comment',
        'Select',
        'Date',
        'Number'
    )),
    field_number integer not null,
    organisation_id integer not null references organisations on delete cascade
);

create index fields_organisation_id_index on fields(organisation_id);

create table field_items (
    id serial primary key,
    field_id integer not null references fields on delete cascade,
    name text not null,
    item_number integer not null,
    organisation_id integer not null references organisations on delete cascade
);

create index field_items_field_id_index on field_items(field_id);

create table user_fields (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    field_id integer not null references fields on delete cascade,
    item_id integer references field_items on delete cascade,
    text_value text,
    date_value timestamptz,
    organisation_id integer not null references organisations on delete cascade
);

create index user_fields_user_id_index on user_fields(user_id);

create table user_areas (
    id serial primary key,
    user_id integer not null references users on delete cascade,
    area_id integer not null references areas on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz,
    role_id integer not null references roles on delete cascade,
    is_admin boolean not null,
    organisation_id integer not null references organisations on delete cascade
);

create index user_areas_index on user_areas(area_id, start_time, end_time);
create index user_areas_user_id_index on user_areas(user_id);

create table question_groups (
    id serial primary key,
    name text not null,
    created_at timestamptz not null default now(),
    organisation_id integer not null references organisations on delete cascade
);

create index question_groups_organisation_id_index on question_groups(organisation_id);

create table shift_series (
    id serial primary key,
    is_single boolean not null,
    notes text,
    created_at timestamptz not null default now(),
    created_by integer not null references users on delete cascade,
    question_group_id integer references question_groups on delete set null,
    organisation_id integer not null references organisations on delete cascade
);

create table shifts (
    id serial primary key,
    area_id integer not null references areas on delete cascade,
    start_time timestamptz not null,
    end_time timestamptz not null,
    break_minutes integer not null,
    series_id integer not null references shift_series on delete cascade,
    organisation_id integer not null references organisations on delete cascade
);

create index shifts_index on shifts(area_id, start_time);
create index shifts_series_id_index on shifts(series_id);

create table shift_roles (
    id serial primary key,
    series_id integer not null references shift_series on delete cascade,
    role_id integer not null references roles on delete cascade,
    capacity integer not null check (capacity >= 0),
    organisation_id integer not null references organisations on delete cascade
);

create index shift_roles_series_id_index on shift_roles(series_id);

create table bookings (
    id serial primary key,
    shift_id integer not null references shifts on delete cascade,
    shift_role_id integer not null references shift_roles on delete cascade,
    user_id integer not null references users on delete cascade,
    booked_at timestamptz not null default now(),
    booked_by integer not null references users on delete cascade,
    organisation_id integer not null references organisations on delete cascade
);

create index bookings_shift_id_index on bookings(shift_id);
create index bookings_shift_role_id_index on bookings(shift_role_id);
create index bookings_user_id_index on bookings(user_id);

create table follower_notes (
    id serial primary key,
    created_by integer not null references users on delete cascade,
    booking_id integer not null references bookings on delete cascade,
    notes text,
    organisation_id integer not null references organisations on delete cascade,
    unique(booking_id, user_id)
);

create table questions (
    id serial primary key,
    group_id integer not null references question_groups on delete cascade,
    question_type text not null check (question_type in (
        'MultipleChoice',
        'Comment',
        'Scale',
        'Numeric')),
    question_order integer not null,
    question text not null,
    organisation_id integer not null references organisations on delete cascade
);

create index questions_group_id_index on questions(group_id);

create table question_roles (
    id serial primary key,
    question_id integer not null references questions on delete cascade,
    role_id integer not null references roles on delete cascade,
    organisation_id integer not null references organisations on delete cascade
);

create index question_roles_question_id_index on question_roles(question_id);

create table options (
    id serial primary key,
    question_id integer not null references questions on delete cascade,
    option_order integer not null,
    label text not null,
    alert_if_selected boolean not null,
    alert_words text,
    organisation_id integer not null references organisations on delete cascade
);

create index options_question_id_index on options(question_id);

create table answers (
    id serial primary key,
    booking_id integer not null references bookings on delete cascade,
    option_id integer not null references options on delete cascade,
    comments text,
    organisation_id integer not null references organisations on delete cascade
);

create index answers_booking_id_index on answers(booking_id);
create index answers_option_id_index on answers(option_id);
