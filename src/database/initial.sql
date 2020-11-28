create table organisations (
    id serial primary key,
    name text not null,
    createdAt timestamptz not null default now(),
    trialEnds timestamptz default now() + interval '14 days',
    logoImageId uuid
);

create table users (
    id serial primary key,
    firstName text not null,
    lastName text not null,
    email text not null unique,
    username text not null,
    password text not null,
    refreshToken uuid not null,
    organisationId integer not null references organisations on delete cascade,
    createdAt timestamptz not null default now(),
    isAdmin boolean not null default false,
    unique(organisationId, username)
);

create table roles (
    id serial primary key,
    name text not null,
    organisationId integer not null references organisations on delete cascade
);

create index rolesOrganisationIdIndex on roles(organisationId);

create table userRoles (
    id serial primary key,
    userId integer not null references users,
    roleId integer not null references roles,
    organisationId integer not null references organisations on delete cascade
);

create index userRolesUserIdIndex on userRoles(userId);

create table areas (
    id serial primary key,
    name text not null,
    timezone text not null,
    organisationId integer not null references organisations on delete cascade
);

create index areasOrganisationIdIndex on areas(organisationId);

create table areaCapacities (
    id serial primary key,
    areaId integer not null references areas on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    capacity integer not null,
    organisationId integer not null references organisations on delete cascade
);

create index areaCapacitiesAreaIdIndex on areaCapacities(areaId);

create table shifts (
    id serial primary key,
    startTime timestamptz not null,
    endTime timestamptz not null,
    breakSeconds integer not null,
    capacity integer,
    notes text,
    organisationId integer not null references organisations on delete cascade
);

create index shiftsOrganisationIdStartTimeIndex on shifts(organisationId, startTime);

create table tasks (
    id serial primary key,
    name text not null,
    organisationId integer not null references organisations on delete cascade
);

create index tasksOrganisationIdIndex on tasks(organisationId);

create table shiftTasks (
    id serial primary key,
    shiftId integer not null references shifts on delete cascade,
    taskId integer not null references tasks on delete cascade,
    startTime timestamptz not null,
    endTime timestamptz not null,
    organisationId integer not null references organisations on delete cascade
);

create index shiftTasksShiftIdIndex on shiftTasks(shiftId);

create table shiftRoles (
    id serial primary key,
    shiftId integer not null references shifts on delete cascade,
    roleId integer not null references roles on delete cascade,
    amount integer not null,
    organisationId integer not null references organisations on delete cascade
);

create index shiftRolesShiftIdIndex on shiftRoles(shiftId);

create table groups (
    id serial primary key,
    name text not null,
    capacity integer,
    organisationId integer not null references organisations on delete cascade
);

create table groupCapacities (
    id serial primary key,
    groupId integer not null references groups on delete cascade,
    shiftId integer not null references shifts on delete cascade,
    capacity integer,
    organisationId integer not null references organisations on delete cascade
);

create index groupCapacitiesShiftIdIndex on groupCapacities(shiftId);
