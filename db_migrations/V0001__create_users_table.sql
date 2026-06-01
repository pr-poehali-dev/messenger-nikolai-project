CREATE TABLE t_p67321282_messenger_nikolai_pr.users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_seen TIMESTAMP DEFAULT NOW()
);