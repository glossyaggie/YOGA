import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { cors } from 'https://deno.land/x/hono@v4.0.0/middleware/cors/index.ts';

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors() });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...cors(), 'Content-Type': 'application/json' }
      });
    }

    // Create upload record
    const { data: upload, error: uploadError } = await supabase
      .from('csv_uploads')
      .insert({
        filename: file.name,
        uploaded_by: userId,
        status: 'processing'
      })
      .select()
      .single();

    if (uploadError) {
      return new Response(JSON.stringify({ error: 'Failed to create upload record' }), {
        status: 400,
        headers: { ...cors(), 'Content-Type': 'application/json' }
      });
    }

    // Read and parse CSV
    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    let processedClasses = 0;
    const errors: string[] = [];

    // Process each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });

        // Expected CSV format from Google Sheet:
        // class_name,description,instructor,level,temperature_cel,duration_minute,max_capacity,day_of_week,start_time,end_time
        
        // Insert or update class
        const { data: classData, error: classError } = await supabase
          .from('classes')
          .upsert({
            name: row.class_name,
            description: row.description,
            instructor: row.instructor,
            level: row.level || 'All Levels',
            temperature_celsius: row.temperature_cel ? parseInt(row.temperature_cel) : null,
            duration_minutes: row.duration_minute ? parseInt(row.duration_minute) : 60,
            max_capacity: row.max_capacity ? parseInt(row.max_capacity) : 24,
            is_active: true
          }, {
            onConflict: 'name'
          })
          .select()
          .single();

        if (classError) {
          errors.push(`Row ${i + 1}: Failed to create class - ${classError.message}`);
          continue;
        }

        // Insert class session
        const { error: sessionError } = await supabase
          .from('class_sessions')
          .upsert({
            class_id: classData.id,
            day_of_week: parseInt(row.day_of_week),
            start_time: row.start_time,
            end_time: row.end_time,
            is_active: true
          }, {
            onConflict: 'class_id,day_of_week,start_time'
          });

        if (sessionError) {
          errors.push(`Row ${i + 1}: Failed to create session - ${sessionError.message}`);
          continue;
        }

        processedClasses++;
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    // Update upload record
    const { error: updateError } = await supabase
      .from('csv_uploads')
      .update({
        status: errors.length > 0 ? 'failed' : 'completed',
        total_classes: lines.length - 1,
        processed_classes: processedClasses,
        error_message: errors.length > 0 ? errors.join('; ') : null
      })
      .eq('id', upload.id);

    return new Response(JSON.stringify({
      success: true,
      upload_id: upload.id,
      processed_classes: processedClasses,
      total_classes: lines.length - 1,
      errors: errors
    }), {
      headers: { ...cors(), 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...cors(), 'Content-Type': 'application/json' }
    });
  }
});
