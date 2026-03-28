insert into passes (name, description, credits, unlimited, validity_days, stripe_price_id)
values
  ('Single Class', '1 class', 1, false, null, '<price_xxx_single>'),
  ('5 Class Pass', '5 classes', 5, false, 60, '<price_xxx_5>'),
  ('10 Class Pass', '10 classes', 10, false, 120, '<price_xxx_10>'),
  ('25 Class Pass', '25 classes', 25, false, 365, '<price_xxx_25>'),
  ('Weekly Unlimited', '7 days unlimited', 0, true, 7, '<price_xxx_weekly>'),
  ('Monthly Unlimited', '30 days unlimited', 0, true, 30, '<price_xxx_monthly>'),
  ('VIP Monthly', 'Membership', 0, true, 30, '<price_xxx_vip_m>'),
  ('VIP Yearly', 'Membership', 0, true, 365, '<price_xxx_vip_y>');
