-- Sample classes
insert into classes (title, instructor, duration_mins) values
  ('Hot Vinyasa Flow', 'Sarah Johnson', 60),
  ('Bikram 26 & 2', 'Mike Chen', 90),
  ('Power Yoga', 'Emma Wilson', 75),
  ('Yin Yoga', 'David Park', 60),
  ('Hot Flow', 'Lisa Martinez', 60),
  ('Restorative Yoga', 'Anna Rodriguez', 45);

-- Sample sessions (next 7 days)
insert into sessions (class_id, starts_at, capacity) values
  (1, now() + interval '2 hours', 20),
  (2, now() + interval '1 day' + interval '6 hours', 25),
  (3, now() + interval '1 day' + interval '9 hours', 15),
  (4, now() + interval '2 days' + interval '18 hours', 20),
  (5, now() + interval '2 days' + interval '19.5 hours', 18),
  (1, now() + interval '3 days' + interval '6 hours', 20),
  (2, now() + interval '3 days' + interval '7.5 hours', 25),
  (6, now() + interval '4 days' + interval '17 hours', 15),
  (3, now() + interval '5 days' + interval '9 hours', 15),
  (4, now() + interval '6 days' + interval '18 hours', 20),
  (5, now() + interval '7 days' + interval '19.5 hours', 18);
