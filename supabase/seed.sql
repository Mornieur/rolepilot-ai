insert into public.candidate_profiles (
  id, name, desired_roles, accepted_seniorities, required_skills,
  preferred_skills, excluded_skills, accepted_work_models, locations
) values
(
  '11111111-1111-4111-8111-111111111111',
  'Frontend specialist',
  array['Frontend Engineer', 'React Engineer'],
  array['senior', 'staff'],
  array['React', 'TypeScript'],
  array['Next.js', 'Accessibility', 'Design systems'],
  array['PHP'],
  array['remote', 'hybrid'],
  array['Brazil', 'United States']
),
(
  '22222222-2222-4222-8222-222222222222',
  'Data and BI specialist',
  array['Data Analyst', 'Business Intelligence Analyst'],
  array['mid', 'senior'],
  array['SQL', 'Python'],
  array['Power BI', 'dbt', 'Product analytics'],
  array['Cold outreach'],
  array['remote', 'hybrid'],
  array['Brazil']
)
on conflict (id) do nothing;

insert into public.target_companies (name, provider, board_identifier, careers_url, enabled, priority) values
  ('Example Platform', 'greenhouse', 'example-platform', null, true, 'high'),
  ('Sample Studio', 'lever', 'sample-studio', null, false, 'normal')
on conflict (provider, board_identifier) do nothing;
