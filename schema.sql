-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Students Table
create table public.students (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    roll_no integer not null,
    class text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    iemis_code text,
    student_id_string text,
    gender text,
    father_name text,
    mother_name text,
    section text,
    year text,
    permanent_address text,
    temporary_address text,
    dob text,
    mother_tongue text,
    disability_type text,
    guardian_name text,
    guardian_contact_number text,
    caste text
);

-- Create Subjects Table
create table public.subjects (
    id uuid default uuid_generate_v4() primary key,
    subject_name text not null,
    subject_code text not null,
    class text,
    credit_hour numeric(4, 2)
);

-- Create Marks Table
create table public.marks (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    marks_obtained numeric(5, 2) not null check (marks_obtained >= 0),
    entered_by uuid references auth.users(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(student_id, subject_id)
);

-- Set up Row Level Security (RLS)
alter table public.students enable row level security;
alter table public.subjects enable row level security;
alter table public.marks enable row level security;

-- Create basic policies (Allow read access to authenticated users, write to authenticated users)
create policy "Enable read access for anon users" on public.students for select to anon using (true);
create policy "Enable insert for anon users" on public.students for insert to anon with check (true);
create policy "Enable update for anon users" on public.students for update to anon using (true);
create policy "Enable delete for anon users" on public.students for delete to anon using (true);

create policy "Enable read access for anon users" on public.subjects for select to anon using (true);
create policy "Enable insert for anon users" on public.subjects for insert to anon with check (true);
create policy "Enable update for anon users" on public.subjects for update to anon using (true);
create policy "Enable delete for anon users" on public.subjects for delete to anon using (true);

create policy "Enable read access for anon users" on public.marks for select to anon using (true);
create policy "Enable insert for anon users" on public.marks for insert to anon with check (true);
create policy "Enable update for anon users" on public.marks for update to anon using (true);
create policy "Enable delete for anon users" on public.marks for delete to anon using (true);

-- Insert dummy subjects for Grades 1-8
insert into public.subjects (subject_name, subject_code) values
('English', 'ENG'),
('Mathematics', 'MATH'),
('Science', 'SCI'),
('Social Studies', 'SOC'),
('Nepali', 'NEP');

-- Create Teachers Table
create table public.teachers (
    id uuid default uuid_generate_v4() primary key,
    first_name text not null,
    middle_name text,
    last_name text not null,
    gender text,
    post text,
    teacher_category text,
    subject_teach text,
    permanent_address text,
    temporary_address text,
    dob text,
    joining_date text,
    phone_number text,
    account_number text,
    username text,
    password text,
    pan_no text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Teachers
alter table public.teachers enable row level security;
create policy "Enable read access for anon users" on public.teachers for select to anon using (true);
create policy "Enable insert for anon users" on public.teachers for insert to anon with check (true);
create policy "Enable update for anon users" on public.teachers for update to anon using (true);
create policy "Enable delete for anon users" on public.teachers for delete to anon using (true);

-- Create Attendance Table
create table public.attendance (
    id uuid default uuid_generate_v4() primary key,
    student_id uuid references public.students(id) on delete cascade not null,
    exam_term text not null,
    attendance_days text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(student_id, exam_term)
);

-- RLS for Attendance
alter table public.attendance enable row level security;
create policy "Enable read access for anon users" on public.attendance for select to anon using (true);
create policy "Enable insert for anon users" on public.attendance for insert to anon with check (true);
create policy "Enable update for anon users" on public.attendance for update to anon using (true);
create policy "Enable delete for anon users" on public.attendance for delete to anon using (true);

-- Create Exam Routines Table
create table public.exam_routines (
    id uuid default uuid_generate_v4() primary key,
    class text not null,
    exam_term text not null,
    subject text not null,
    exam_date text not null,
    shift text,
    exam_time text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(class, exam_term, subject)
);

-- RLS for Exam Routines
alter table public.exam_routines enable row level security;
create policy "Enable read access for anon users" on public.exam_routines for select to anon using (true);
create policy "Enable insert for anon users" on public.exam_routines for insert to anon with check (true);
create policy "Enable update for anon users" on public.exam_routines for update to anon using (true);
create policy "Enable delete for anon users" on public.exam_routines for delete to anon using (true);

-- Create Proxy Classes Table
create table public.proxy_classes (
    id text primary key,
    date text not null,
    class_name text not null,
    section text,
    period text not null,
    absent_teacher_id text,
    absent_teacher_name text not null,
    proxy_teacher_id text,
    proxy_teacher_name text not null,
    subject_name text not null,
    reason text,
    status text default 'Assigned',
    approved_by text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Proxy Classes
alter table public.proxy_classes enable row level security;
create policy "Enable read access for anon users" on public.proxy_classes for select to anon using (true);
create policy "Enable insert for anon users" on public.proxy_classes for insert to anon with check (true);
create policy "Enable update for anon users" on public.proxy_classes for update to anon using (true);
create policy "Enable delete for anon users" on public.proxy_classes for delete to anon using (true);

-- Create Teacher Attendance Table
create table public.teacher_attendance (
    id uuid default uuid_generate_v4() primary key,
    teacher_id uuid references public.teachers(id) on delete cascade not null,
    date text not null,
    status text not null,
    remarks text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(teacher_id, date)
);

-- RLS for Teacher Attendance
alter table public.teacher_attendance enable row level security;
create policy "Enable read access for anon users" on public.teacher_attendance for select to anon using (true);
create policy "Enable insert for anon users" on public.teacher_attendance for insert to anon with check (true);
create policy "Enable update for anon users" on public.teacher_attendance for update to anon using (true);
create policy "Enable delete for anon users" on public.teacher_attendance for delete to anon using (true);

-- Create Accountant Credentials Table
create table public.accountant_credentials (
    id text primary key,
    username text not null,
    password text not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Accountant Credentials
alter table public.accountant_credentials enable row level security;
create policy "Enable read access for anon users" on public.accountant_credentials for select to anon using (true);
create policy "Enable insert for anon users" on public.accountant_credentials for insert to anon with check (true);
create policy "Enable update for anon users" on public.accountant_credentials for update to anon using (true);
create policy "Enable delete for anon users" on public.accountant_credentials for delete to anon using (true);

-- Insert default accountant credentials
insert into public.accountant_credentials (id, username, password) values ('default', 'accountant', 'accountant123') on conflict (id) do nothing;

-- Create Accounting Topics Table
create table public.accounting_topics (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    type text not null, -- 'Income' or 'Expense'
    source_type text default 'आन्तरिक स्रोत', -- 'सरकारी' or 'आन्तरिक स्रोत'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Accounting Subtopics Table
create table public.accounting_subtopics (
    id uuid default uuid_generate_v4() primary key,
    topic_id uuid references public.accounting_topics(id) on delete cascade not null,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Accounting Topics
alter table public.accounting_topics enable row level security;
alter table public.accounting_subtopics enable row level security;

create policy "Enable full access for anon users" on public.accounting_topics for all to anon using (true) with check (true);
create policy "Enable full access for anon users" on public.accounting_subtopics for all to anon using (true) with check (true);

-- Create Accounting Vouchers Table
create table public.accounting_vouchers (
    id uuid default uuid_generate_v4() primary key,
    topic_id uuid references public.accounting_topics(id) on delete restrict not null,
    subtopic_id uuid references public.accounting_subtopics(id) on delete set null,
    source_type text,
    date text not null,
    voucher_number text not null,
    description text,
    details jsonb,
    fiscal_year text default '2083/2084',
    topic_type text default 'Income',
    cash_debit numeric(12, 2) default 0,
    cash_credit numeric(12, 2) default 0,
    bank_debit numeric(12, 2) default 0,
    bank_credit numeric(12, 2) default 0,
    kharcha_debit numeric(12, 2) default 0,
    kharcha_credit numeric(12, 2) default 0,
    bibidh_debit numeric(12, 2) default 0,
    bibidh_credit numeric(12, 2) default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS for Accounting Vouchers
alter table public.accounting_vouchers enable row level security;
create policy "Enable full access for anon users" on public.accounting_vouchers for all to anon using (true) with check (true);
