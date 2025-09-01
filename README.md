# The Hot Temple - Yoga Studio App

A production-ready Expo React Native app for a yoga studio with live Supabase backend and Stripe payments.

## Features

- 🔐 **Authentication**: Supabase Auth with email/password
- 💳 **Payments**: Stripe Checkout integration
- 📅 **Class Booking**: Real-time class scheduling and booking
- 💰 **Credit System**: Pass-based credit management
- 📊 **Analytics**: User statistics and booking history
- 🔄 **Real-time**: Live data updates

## Tech Stack

- **Frontend**: Expo React Native with TypeScript
- **Backend**: Supabase (Auth, Postgres, Edge Functions)
- **Payments**: Stripe Checkout
- **Navigation**: Expo Router
- **State**: React hooks with Supabase real-time

## Setup Instructions

### 1. Environment Configuration

Update `app.json` with your Supabase and Stripe configuration:

```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_SUPABASE_URL": "your-supabase-url",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-supabase-anon-key",
      "EXPO_PUBLIC_SUCCESS_URL": "thehottemple://checkout/success",
      "EXPO_PUBLIC_CANCEL_URL": "thehottemple://checkout/cancel"
    }
  }
}
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the migration in `supabase/migrations/0001_init.sql`
3. Set environment variables in Supabase Functions:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`

### 3. Stripe Setup

1. Create Stripe products and prices for your passes
2. Update `supabase/seed.sql` with real Stripe price IDs
3. Deploy the edge functions:
   - `create-checkout`
   - `stripe-webhook`
   - `book-class`
4. Set up webhook endpoint in Stripe dashboard pointing to your `stripe-webhook` function

### 4. Database Seeding

Run the seed file in Supabase SQL editor:

```sql
-- Replace with your actual Stripe price IDs
insert into passes (name, description, credits, unlimited, validity_days, stripe_price_id)
values
  ('Single Class', '1 class', 1, false, null, 'price_xxx_single'),
  ('5 Class Pass', '5 classes', 5, false, 60, 'price_xxx_5'),
  ('10 Class Pass', '10 classes', 10, false, 120, 'price_xxx_10'),
  ('25 Class Pass', '25 classes', 25, false, 365, 'price_xxx_25'),
  ('Weekly Unlimited', '7 days unlimited', 0, true, 7, 'price_xxx_weekly'),
  ('Monthly Unlimited', '30 days unlimited', 0, true, 30, 'price_xxx_monthly'),
  ('VIP Monthly', 'Membership', 0, true, 30, 'price_xxx_vip_m'),
  ('VIP Yearly', 'Membership', 0, true, 365, 'price_xxx_vip_y');
```

### 5. Install Dependencies

```bash
npm install
# or
bun install
```

### 6. Run the App

```bash
npm start
# or
bun start
```

## Database Schema

### Tables

- **profiles**: User profiles with Stripe customer IDs
- **passes**: Available class passes with Stripe price mapping
- **purchases**: User pass purchases
- **credit_ledger**: Credit balance tracking
- **classes**: Class definitions
- **sessions**: Scheduled class sessions
- **bookings**: User class bookings

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:
- Users can only read their own data
- Public read access for passes, classes, and sessions
- Authenticated users can create bookings and purchases

## API Endpoints

### Edge Functions

- `POST /functions/v1/create-checkout`: Create Stripe checkout session
- `POST /functions/v1/book-class`: Book a class (deducts credits)
- `POST /functions/v1/stripe-webhook`: Handle Stripe webhooks

## Payment Flow

1. User selects a pass
2. App calls `create-checkout` with pass ID
3. User redirected to Stripe Checkout
4. On successful payment, Stripe webhook credits user account
5. User can book classes using credits

## Booking Flow

1. User views available sessions
2. App checks user's credit balance
3. User books class via `book-class` function
4. Function deducts 1 credit and creates booking
5. Capacity is respected (no overbooking)

## Security

- Only anon key in client code
- Service role key only in edge functions
- RLS policies protect user data
- Stripe webhook signature verification
- No sensitive data in client

## Production Deployment

1. Set up Supabase production project
2. Configure Stripe production keys
3. Deploy edge functions
4. Set up webhook endpoints
5. Test payment flow with real cards
6. Submit to App Store/Play Store

## Testing

- Use Stripe test cards for development
- Test webhook handling with Stripe CLI
- Verify RLS policies work correctly
- Test booking capacity limits

## Support

For issues or questions, please check the Supabase and Stripe documentation or create an issue in this repository.
