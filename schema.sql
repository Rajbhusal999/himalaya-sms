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
    guardian_contact_number text
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
