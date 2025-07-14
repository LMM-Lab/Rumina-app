-- ---------- カタログ ---------- --
CREATE TABLE stt_catalog (
  stt_id        TEXT PRIMARY KEY,
  short_key     TEXT UNIQUE NOT NULL,
  model_name    TEXT,
  version       TEXT,
  param_million INTEGER,
  precision     TEXT,
  provider      TEXT,
  notes         TEXT
);

CREATE TABLE vlm_catalog (
  vlm_id        TEXT PRIMARY KEY,
  short_key     TEXT UNIQUE NOT NULL,
  model_name    TEXT,
  version       TEXT,
  param_million INTEGER,
  precision     TEXT,
  architecture  TEXT,
  context_len   INTEGER,
  provider      TEXT,
  notes         TEXT
);

CREATE TABLE tts_catalog (
  tts_id        TEXT PRIMARY KEY,
  short_key     TEXT UNIQUE NOT NULL,
  model_name    TEXT,
  version       TEXT,
  precision     TEXT,
  provider      TEXT,
  notes         TEXT
);

-- ---------- モデルセット ---------- --
CREATE TABLE model_set_catalog (
  set_id     TEXT PRIMARY KEY,
  set_type   TEXT CHECK (set_type IN ('single','dual')),
  stt_id     TEXT REFERENCES stt_catalog(stt_id),
  vlm_id     TEXT REFERENCES vlm_catalog(vlm_id),
  sys2_id    TEXT REFERENCES vlm_catalog(vlm_id),
  sys3_id    TEXT REFERENCES vlm_catalog(vlm_id),
  tts_id     TEXT REFERENCES tts_catalog(tts_id),
  filler_id  TEXT REFERENCES vlm_catalog(vlm_id),
  created_at TIMESTAMPTZ DEFAULT now(),
  comment    TEXT
);

-- ---------- シングルパス ---------- --
CREATE TABLE single_turns (
  request_id  TEXT PRIMARY KEY,
  session_id  TEXT,
  turn_index  INTEGER,
  timestamp_utc TIMESTAMP,

  model_set_id TEXT REFERENCES model_set_catalog(set_id),

  stt_latency_ms  INTEGER,
  transcript      TEXT,

  vlm_latency_ms  INTEGER,
  vlm_tokens_in   INTEGER,
  vlm_tokens_out  INTEGER,
  vlm_tok_per_sec REAL,

  tts_latency_ms  INTEGER,

  total_turn_latency_ms INTEGER,
  net_up_ms       INTEGER,
  net_down_ms     INTEGER,
  error_flag      TEXT
);

CREATE INDEX idx_single_turns_time ON single_turns(timestamp_utc);
