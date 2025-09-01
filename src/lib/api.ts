import { supabase } from './supabase';
import Constants from 'expo-constants';

export async function createCheckout(passId: number, userId: string) {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  // Get URLs from the same source as supabase config
  const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL;
  const successUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUCCESS_URL;
  const cancelUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_CANCEL_URL;

  console.log('Checkout config:', { supabaseUrl, successUrl, cancelUrl, passId, userId });

  if (!supabaseUrl) {
    throw new Error('Supabase URL not configured');
  }

  const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      passId,
      successUrl,
      cancelUrl,
    }),
  });

  console.log('Checkout response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Checkout error:', response.status, errorText);
    throw new Error(`Failed to create checkout session: ${errorText}`);
  }

  const result = await response.json();
  console.log('Checkout result:', result);
  return result;
}

export async function bookClass(classId: number, selectedDate: string) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Check if user has enough credits
  const { data: creditData, error: creditError } = await supabase
    .from('credit_ledger')
    .select('delta')
    .eq('user_id', user.id);

  if (creditError) {
    throw new Error('Failed to check credits');
  }

  const totalCredits = creditData?.reduce((sum, entry) => sum + entry.delta, 0) || 0;
  
  if (totalCredits < 1) {
    throw new Error('Insufficient credits. Please purchase a class pass.');
  }

  // Get class information
  const { data: classData, error: classError } = await supabase
    .from('classes')
    .select('*')
    .eq('id', classId)
    .single();

  if (classError) {
    throw new Error('Failed to get class information');
  }

  // Check if user is already booked for this class on this date (exclude cancelled bookings)
  const { data: allUserBookings, error: bookingCheckError } = await supabase
    .from('bookings')
    .select('id, cancelled_at, created_at, class_id, session_id, booking_date')
    .eq('user_id', user.id);

  if (bookingCheckError) {
    console.error('Booking check error:', bookingCheckError);
    throw new Error('Failed to check existing booking');
  }

  // Filter to find active bookings for this class and date
  const activeBookings = (allUserBookings || []).filter(booking => 
    booking.cancelled_at === null && 
    booking.class_id === classId && 
    booking.booking_date === selectedDate
  );

  console.log('Booking check:', {
    classId,
    selectedDate,
    userId: user.id,
    allBookings: allUserBookings?.length || 0,
    activeBookings: activeBookings.length,
    activeBookingDetails: activeBookings
  });

  if (activeBookings.length > 0) {
    console.log('Found existing active booking:', activeBookings[0]);
    throw new Error('You are already booked for this class on this date');
  }

  // Create booking
  const { error: bookingError } = await supabase
    .from('bookings')
    .insert({
      user_id: user.id,
      class_id: classId,
      booking_date: selectedDate,
      created_at: new Date().toISOString(),
    });

  if (bookingError) {
    console.error('Booking error:', bookingError);
    throw new Error('Failed to book class');
  }

  // Deduct credit
  const { error: creditDeductError } = await supabase
    .from('credit_ledger')
    .insert({
      user_id: user.id,
      delta: -1,
      reason: 'class_booking',
      ref_id: classId,
    });

  if (creditDeductError) {
    console.error('Credit deduction error:', creditDeductError);
    throw new Error('Failed to deduct credit');
  }

  return { success: true };
}

export async function getUserBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      class:classes(
        class_name,
        instructor,
        start_time,
        level,
        temperature_celsius
      )
    `)
    .eq('user_id', user.id)
    .is('cancelled_at', null)
    .gte('booking_date', new Date().toISOString().split('T')[0])
    .order('booking_date, class(start_time)');

  if (error) {
    throw new Error('Failed to fetch bookings');
  }

  return bookings || [];
}

export async function getUserBookingHistory() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      class:classes(
        class_name,
        instructor,
        start_time,
        level,
        temperature_cel
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error('Failed to fetch booking history');
  }

  return bookings || [];
}

export async function cancelBooking(bookingId: number) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get booking details
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(`
      *,
      class:classes(
        start_time
      )
    `)
    .eq('id', bookingId)
    .eq('user_id', user.id)
    .single();

  if (bookingError) {
    throw new Error('Booking not found');
  }

  // Handle both old and new booking formats
  let classDateTime: Date;
  
  if (booking.booking_date && booking.class?.start_time) {
    // New format: booking_date + class.start_time
    classDateTime = new Date(`${booking.booking_date}T${booking.class.start_time}`);
  } else if (booking.session_id) {
    // Old format: try to get from sessions table
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('starts_at')
      .eq('id', booking.session_id)
      .single();
    
    if (sessionError || !session) {
      throw new Error('Unable to determine class time for this booking');
    }
    
    classDateTime = new Date(session.starts_at);
  } else {
    throw new Error('Unable to determine class time for this booking');
  }

  // Check if class has already ended (allow cancellation of past classes)
  const today = new Date();
  const timeDiff = classDateTime.getTime() - today.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);
  
  // Allow cancellation if:
  // 1. Class has already ended (hoursDiff < -1, meaning more than 1 hour in the past)
  // 2. Class is more than 1 hour in the future
  if (hoursDiff >= -1 && hoursDiff < 1) {
    throw new Error('Cannot cancel within 1 hour of class start');
  }

  // Cancel booking
  const { error: cancelError } = await supabase
    .from('bookings')
    .update({
      cancelled_at: new Date().toISOString(),
      cancelled_by_user: true,
    })
    .eq('id', bookingId);

  if (cancelError) {
    throw new Error('Failed to cancel booking');
  }

  // Refund credit if not already refunded
  if (!booking.credit_refunded) {
    const { error: refundError } = await supabase
      .from('credit_ledger')
      .insert({
        user_id: user.id,
        delta: 1,
        reason: 'class_cancellation',
        ref_id: bookingId,
      });

    if (refundError) {
      throw new Error('Failed to refund credit');
    }

    // Mark booking as credit refunded
    await supabase
      .from('bookings')
      .update({ credit_refunded: true })
      .eq('id', bookingId);
  }

  return { success: true };
}
