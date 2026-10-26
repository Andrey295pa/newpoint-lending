// Netlify Function: приймає дані форми та надсилає повідомлення в Telegram.
// Токен і chat_id беруться зі змінних середовища, щоб не світити їх у клієнтському коді.
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Telegram не налаштовано на сервері (відсутні env змінні).' })
    };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Невалідний JSON.' }) };
  }

  const name = (data.name || '').trim();
  const phone = (data.phone || '').trim();
  const email = (data.email || '').trim();
  const source = (data.source || 'Форма на сайті').trim();

  if (!name || !phone) {
    return { statusCode: 400, body: JSON.stringify({ error: "Поля 'name' і 'phone' обов'язкові." }) };
  }

  const text =
    `📩 Нова заявка (${source})\n` +
    `Ім'я: ${name}\n` +
    `Телефон: ${phone}` +
    (email ? `\nEmail: ${email}` : '');

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: text })
    });

    const result = await response.json();

    if (!result.ok) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Telegram API повернув помилку.', details: result }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Не вдалося надіслати повідомлення.', details: String(err) }) };
  }
};
