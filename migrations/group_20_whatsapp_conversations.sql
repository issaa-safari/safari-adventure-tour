-- Group 20: WhatsApp conversation state
-- Run in Supabase SQL Editor

create table if not exists whatsapp_conversations (
  id           uuid primary key default gen_random_uuid(),
  wa_id        text not null unique,
  step         text not null default 'awaiting_email'
                 check (step in ('awaiting_email', 'awaiting_country', 'done')),
  collected_name     text,
  collected_email    text,
  collected_country  text,
  collected_question text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists whatsapp_conversations_wa_id_idx on whatsapp_conversations (wa_id);

drop trigger if exists whatsapp_conversations_updated_at on whatsapp_conversations;
create trigger whatsapp_conversations_updated_at
  before update on whatsapp_conversations
  for each row execute function update_updated_at_column();
