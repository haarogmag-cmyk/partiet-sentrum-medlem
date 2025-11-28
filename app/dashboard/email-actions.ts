'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface BulkEmailParams {
  subject: string
  message: string
  filters?: { 
    q?: string
    fylke?: string
    lokal?: string
    org?: string
  }
  recipientIds?: string[]
  includeUS?: boolean
}

export async function sendBulkEmail({ subject, message, filters, recipientIds, includeUS }: BulkEmailParams) {
  // --- DEBUG LOGG START ---
  console.log("\n--- DEBUG E-POST SENDING ---");
  console.log("1. Mottok flagget includeUS:", includeUS);
  console.log("2. Mottok filtre:", JSON.stringify(filters));
  // --- DEBUG SLUTT ---

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Logg inn.')

  let recipients: any[] = []

  if (recipientIds && recipientIds.length > 0) {
      const { data } = await supabase.from('members').select('email').in('id', recipientIds)
      recipients = data || []
  } 
  else if (filters) {
      const { data: allowedZips } = await supabase.rpc('get_my_allowed_zip_codes')
      const zipList = allowedZips.map((z: any) => z.code)
      
      console.log("3. Tillatte postnumre:", zipList.length); // Debug

      // Bruk ADMIN klienten
      const supabaseAdmin = createAdminClient()
      let queryBuilder = supabaseAdmin.from('member_details_view').select('email, first_name, payment_status_ps'); // Henter status for debug

      if (zipList.length > 0) {
          queryBuilder = queryBuilder.in('postal_code', zipList)
      }
      if (filters.q) {
          queryBuilder = queryBuilder.or(`first_name.ilike.%${filters.q}%,last_name.ilike.%${filters.q}%`);
      }

      // LOGIKK
      if (includeUS) {
          console.log("4. VI INKLUDERER US -> Nullstiller org-filter");
          // Vi gjør INGENTING her, som betyr "Hent alle".
      } else {
          console.log("4. STANDARD FILTER -> Bruker strenge regler");
          if (filters.org === 'us') queryBuilder = queryBuilder.contains('membership_type', { youth: true });
          else if (filters.org === 'ps') queryBuilder = queryBuilder.neq('payment_status_ps', 'not_applicable');
      }

      const { data, error } = await queryBuilder;
      
      if (error) console.error("❌ Database feil:", error);
      
      recipients = data || []
      console.log("5. Antall funnet i databasen:", recipients.length);
  }

  if (!recipients || recipients.length === 0) {
      return { count: 0, status: 'Ingen mottakere.' };
  }

  const uniqueEmails = Array.from(new Set(recipients.map(r => r.email))).map(e => ({email: e}));

  // Loggføring
  await supabase.from('communication_logs').insert({
      sent_by: user.id,
      subject: subject,
      message_preview: message.substring(0, 50),
      recipient_count: uniqueEmails.length,
      filter_criteria: { ...filters, includeUS, debug: 'ver2' },
      channel: 'email'
  });

  return { success: true, count: uniqueEmails.length };
}