import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';

const app = express();
const PORT = process.env.PORT || 3000;

// === CORS ===
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://xlmnr.ru';
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || origin === allowedOrigin || origin.endsWith('.onreza.app')) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '32kb' }));

// === PostgreSQL ===
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false }
});

// Проверка таблицы при старте
async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        text TEXT NOT NULL,
        date TIMESTAMPTZ DEFAULT NOW(),
        approved BOOLEAN DEFAULT FALSE
      )
    `);
    console.log('Table reviews ready');
  } catch (e) {
    console.error('DB init error:', e.message);
  }
}
ensureTable();

// === TG-PROXY ===
app.post('/tg', async (req, res) => {
  try {
    const { name, phone, message, website } = req.body || {};

    // Honeypot
    if (website) {
      return res.status(200).json({ ok: true });
    }

    if (!name || !phone) {
      return res.status(400).json({ error: 'name and phone required' });
    }

    const token = process.env.TG_TOKEN;
    const chatId = process.env.TG_CHAT_ID;

    if (!token || !chatId) {
      console.error('TG secrets missing');
      return res.status(500).json({ error: 'Server misconfigured' });
    }

    const text = `
🔔 <b>Новая заявка с xlmnr.ru</b>

👤 <b>Имя:</b> ${escapeHtml(name)}
📞 <b>Телефон:</b> ${escapeHtml(phone)}
💬 <b>Сообщение:</b> ${escapeHtml(message || '—')}
    `.trim();

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML'
      })
    });

    if (!tgRes.ok) {
      const err = await tgRes.text();
      console.error('Telegram error:', err);
      return res.status(502).json({ error: 'Telegram failed' });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Internal error' });
  }
});

// === REVIEWS PUBLIC ===
app.get('/api/reviews', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, text, date, approved FROM reviews WHERE approved = true ORDER BY date DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { name, text } = req.body || {};
    if (!name || !text || name.length > 80 || text.length > 1000) {
      return res.status(400).json({ error: 'Invalid data' });
    }

    const { rows } = await pool.query(
      `INSERT INTO reviews (name, text) VALUES ($1, $2) RETURNING id, name, text, date, approved`,
      [name.trim(), text.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// === ADMIN ===
function checkAdmin(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

app.get('/api/admin/reviews', checkAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, text, date, approved FROM reviews ORDER BY date DESC`
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.put('/api/admin/reviews/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `UPDATE reviews SET approved = true WHERE id = $1 RETURNING id`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

app.delete('/api/admin/reviews/:id', checkAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`DELETE FROM reviews WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'DB error' });
  }
});

// === AI (простой fallback, можно заменить на GigaChat) ===
app.post('/api/ai', async (req, res) => {
  const { message } = req.body || {};
  if (!message) return res.status(400).json({ error: 'message required' });

  // Простой rule-based ответ (позже можно подключить GigaChat / YandexGPT)
  const reply = `Спасибо за вопрос! Пока ИИ-ассистент в режиме базовых ответов. Напишите нам через форму — ответим лично.`;
  res.json({ reply });
});

// Health
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`XLMNR server running on port ${PORT}`);
});

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
