# Інструкція: локальний запуск, хостинг, форма заявок і домен

## 1. Запуск локально

Сайт — статичний (HTML/CSS/JS), без серверного бекенду.

**Найпростіше:** відкрити `index.html` у браузері подвійним кліком.

**Рекомендовано** (щоб уникнути обмежень `file://`):

- **Python:**
  ```powershell
  cd d:\app_NP\Lending-test
  python -m http.server 8000
  ```
  Відкрити `http://localhost:8000`

- **Node.js:**
  ```powershell
  npx serve
  ```

- **VS Code Live Server** — розширення, ПКМ на `index.html` → "Open with Live Server" (автооновлення при змінах).

## 2. Розміщення на хостингу

### Звичайний shared-хостинг (cPanel/File Manager або FTP)
1. Зайти в File Manager → папка `public_html` (або `www`/`htdocs`).
2. Завантажити `index.html`, `style.css`, `script.js` у корінь.
3. Або підключитись через FTP (FileZilla/WinSCP) і перетягнути файли.

### Безкоштовні варіанти
- **GitHub Pages** — закинути файли в репозиторій, увімкнути Pages в налаштуваннях.
- **Netlify / Vercel** — drag&drop деплой або автодеплой через git push.

## 3. Netlify vs Vercel — що це і різниця

Хмарні платформи для хостингу статичних сайтів і serverless-функцій: деплой через git, автоматичне оновлення сайту, безкоштовний SSL, CDN, підключення власного домену.

| | Netlify | Vercel |
|---|---|---|
| Фокус | Універсальні статичні сайти, форми (вбудовано) | Оптимізовано під Next.js/React |
| Функції | Netlify Functions (AWS Lambda) | Vercel Functions (Edge/Serverless) |
| Форми | Netlify Forms — збір заявок без коду | Немає, потрібен власний бекенд/функція |
| Безкоштовний ліміт функцій | 125 000 викликів/міс | 100 000 викликів/міс (Hobby) |
| Найкраще для | Простих сайтів, лендінгів, HTML/CSS/JS | Проєктів на React/Next.js/Vue |

**Для цього лендінгу (чистий HTML/CSS/JS)** обидва підходять, але Netlify трохи зручніший через вбудовані Netlify Forms і простіший Telegram-проксі.

### Безкоштовні тарифи — умови

**Netlify (Free):**
- 100 GB трафіку/міс
- 300 хвилин збірки/міс
- 125 000 викликів функцій/міс, 100 год виконання
- Netlify Forms: 100 заявок/міс
- SSL і підключення власного домену — безкоштовно

**Vercel (Hobby):**
- 100 GB трафіку/міс
- 100 000 викликів функцій/міс
- Безкоштовно формально лише для особистих/некомерційних проєктів (для комерції офіційно потрібен Pro)
- SSL і підключення власного домену — безкоштовно

**Обмеження обох:** при перевищенні ліміту сайт не падає, а сповільнюється або потребує платного плану (~$19-20/міс); немає підтримки важких бекендів з постійними з'єднаннями до БД (тільки serverless-виклики); домен купується окремо в реєстратора.

## 4. Як зробити, щоб форма реально працювала

Форма зараз лише показує повідомлення (`script.js`), без реальної відправки даних. Варіанти без власного сервера:

| Сервіс | Переваги | Недоліки |
|---|---|---|
| **Formspree** | Проста інтеграція (просто `action` форми); email одразу; захист від спаму | Безкоштовно ~50 заявок/міс; дані йдуть через сторонній сервіс |
| **EmailJS** | Гнучкі шаблони листів; підтримка Gmail/Outlook/SMTP | Публічний ключ видно в коді; ліміт ~200 листів/міс; шле прямо з браузера |
| **Telegram Bot API** | Миттєві сповіщення в месенджер; безкоштовно без лімітів | Токен не можна безпечно зберігати в клієнтському JS без проксі-функції |
| **Google Forms / Apps Script → Sheets** | Безкоштовно без лімітів; дані одразу в таблиці | Потрібно налаштувати Apps Script Web App |
| **Netlify Forms** | Нуль коду — атрибут `data-netlify="true"`; вбудований спам-фільтр | Працює тільки на Netlify; 100 заявок/міс безкоштовно |
| **Tally / Jotform (embed)** | Готовий конструктор, багато інтеграцій | Менше контролю над дизайном; ліміти/водяні знаки на безкоштовному плані |

### Telegram-бот через безпечну проксі-функцію (рекомендовано)

Архітектура:
```
Браузер (форма) → POST /api/send-telegram → Serverless-функція → Telegram API
```
Токен бота зберігається тільки на сервері (змінна середовища), у `script.js` його немає.

**Кроки:**
1. Створити бота через **@BotFather** в Telegram (`/newbot`) → отримати токен.
2. Написати боту будь-яке повідомлення, потім відкрити:
   `https://api.telegram.org/bot<ТОКЕН>/getUpdates` → знайти `chat_id`.
3. Створити serverless-функцію:
   - Netlify: `netlify/functions/send-telegram.js`
   - Vercel: `api/send-telegram.js`
   Функція приймає POST з даними форми і робить `fetch` до
   `https://api.telegram.org/bot<TOKEN>/sendMessage`, де `TOKEN` і `chat_id`
   беруться з `process.env.TELEGRAM_TOKEN` / `process.env.TELEGRAM_CHAT_ID`.
4. У панелі Netlify/Vercel (Site settings → Environment variables) додати:
   - `TELEGRAM_TOKEN`
   - `TELEGRAM_CHAT_ID`
5. У `script.js` замінити `console.log(...)` на:
   ```js
   fetch('/.netlify/functions/send-telegram', {   // або '/api/send-telegram' для Vercel
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({ name, phone, email: form.email.value.trim() })
   });
   ```
6. Деплой — залити репозиторій на GitHub → підключити до Netlify/Vercel → автодеплой.

### ✅ Статус реалізації (вже зроблено в проєкті)

- `netlify/functions/send-telegram.js` — готова функція, приймає POST і шле повідомлення в Telegram.
- `script.js` — форма вже відправляє `fetch('/.netlify/functions/send-telegram', ...)` замість `console.log`.
- `.env` та `.gitignore` — створені (токен і chat_id не потрапляють у git).
- `netlify.toml` — вказує `publish = "."` і `functions = "netlify/functions"`.

### Як локально запустити і протестити форму

**1. Встановити Netlify CLI (один раз):**
```bash
npm install -g netlify-cli
```
Якщо встановлення падає з помилкою мережі (внутрішній npm-реєстр компанії не бачить пакет), вказати публічний реєстр явно:
```bash
npm install -g netlify-cli --registry=https://registry.npmjs.org/
```

**2. Перейти в папку проєкту:**
```bash
cd /Users/andrijpa/Desktop/app_NP/Lending-test
```

**3. Запустити сервер з підставленими змінними середовища** (саме так — `.env` автоматично не завжди підхоплюється CLI, тому токен і chat_id передаються напряму в команді; `--dir`/`--functions` потрібні, бо без них CLI іноді неправильно визначає кореневу папку проєкту):
```bash
TELEGRAM_TOKEN="8943564220:AAHKopbBJi6oFqGfEHi5lRceXyx43bRwxBM" \
TELEGRAM_CHAT_ID="375080264" \
netlify dev --dir . --functions ./netlify/functions
```

**4. Дочекатися в терміналі рядка:**
```
Local dev server ready: http://localhost:8888
```

**5. Відкрити в браузері:** `http://localhost:8888`

**6. Заповнити форму** (ім'я + телефон) і надіслати. При успіху — повідомлення на сторінці і заявка прийде в бот `t.me/NP_order_test_bot`.

**7. Зупинити сервер:** `Ctrl + C` у терміналі.

**Перевірка функції напряму через curl (опційно, без відкриття сторінки):**
```bash
curl -s -X POST http://localhost:8888/.netlify/functions/send-telegram \
  -H "Content-Type: application/json" \
  -d '{"name":"Тест","phone":"+380991234567","email":"test@example.com"}'
```
Очікувана відповідь: `{"success":true}`.

## 5. Планування: лендінг зараз → повноцінний сайт пізніше

1. **Домен** — купити одразу окремо від хостингу (Imena.ua, Namecheap тощо), назва без прив'язки до "landing"/"test".
2. **Хостинг з запасом на майбутнє:**
   - Статичний лендінг зараз → Netlify/Vercel/GitHub Pages (безкоштовно).
   - Якщо в майбутньому CMS/БД/кабінет користувача → заздалегідь обрати хостинг, що це підтримує (shared PHP+MySQL для WordPress/Laravel, VPS для повного контролю, Netlify/Vercel для Next.js/React).
3. **Архітектура переходу:**
   - Тримати лендінг у корені домену (не на піддомені), щоб зберегти SEO/трафік при заміні на повний сайт.
   - Форму заявок (Telegram/Formspree) проєктувати так, щоб легко замінити на CRM-інтеграцію пізніше.
4. **Рекомендований шлях:** зараз — лендінг на Netlify/Vercel + власний домен; пізніше — розширення того ж проєкту або перенесення домену на новий хостинг з редіректом/архівом старого лендінгу.

## 6. Деплой на Netlify + підключення домену (покроково)

Домен куплено: **newpoint.com.ua** (реєстратор HostIQ). Оскільки лендінг буде ще змінюватись — деплоїти обов'язково через **GitHub + автодеплой**, щоб кожен `git push` одразу оновлював сайт без ручного перезавантаження файлів.

### Крок 1. Підготувати git-репозиторій локально

```bash
cd /Users/andrijpa/Desktop/app_NP/Lending-test
git init
git add .
git commit -m "Initial landing page"
git branch -M main
```

### Крок 2. Створити репозиторій на GitHub і запушити

1. На github.com → **New repository** (напр. `newpoint-landing`), не ініціалізувати README.
2. У терміналі:
   ```bash
   git remote add origin https://github.com/<твій_логін>/newpoint-landing.git
   git push -u origin main
   ```

### Крок 3. Підключити репозиторій до Netlify

1. Зайти на **netlify.com** → **Add new site → Import an existing project**.
2. Авторизуватись через GitHub → вибрати репозиторій `newpoint-landing`.
3. Build settings — залишити пустими (build command не потрібна, статичний сайт), **Publish directory**: `.`
4. **Deploy site** → через ~30 сек сайт буде на `https://<random-name>.netlify.app`.

### Крок 4. Додати env-змінні Telegram

**Site settings → Environment variables** → додати:
- `TELEGRAM_TOKEN`
- `TELEGRAM_CHAT_ID`

Потім **Deploys → Trigger deploy** (щоб підхопились змінні).

### Крок 5. Підключити домен newpoint.com.ua

1. У Netlify: **Site settings → Domain management → Add a domain** → ввести `newpoint.com.ua`.
2. Netlify покаже свої 4 NS-сервери (напр. `dns1.p0X.nsone.net`, `dns2...` і т.д.) — скопіювати їх.
3. Зайти в **HostIQ панель → Мої домени → newpoint.com.ua** → знайти розділ **DNS / Name servers / Управління NS-серверами**.
4. Замінити поточні NS-сервери HostIQ на ті 4, що дав Netlify.
5. Зберегти. Зачекати 1-24 год на поширення DNS.
6. Netlify автоматично видасть безкоштовний SSL (Let's Encrypt) після підтвердження DNS.

### Крок 6. Перевірка

- Відкрити `https://newpoint.com.ua` — має показувати лендінг.
- Перевірити всі форми — заявка повинна прийти в Telegram.

### Як оновлювати сайт у майбутньому

```bash
# редагуєш файли → тестуєш локально (netlify dev) → потім:
git add .
git commit -m "Опис змін"
git push
```
Netlify сам передеплоїть за ~30-60 сек, домен і env-змінні лишаються ті самі. У вкладці **Deploys** можна подивитись історію і за потреби одним кліком відкотитись (**Rollback**) до попередньої версії.
