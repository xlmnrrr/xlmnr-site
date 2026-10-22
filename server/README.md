# XLMNR Backend (ONREZA)

Объединённый сервис:
- POST /tg — форма → Telegram
- GET/POST /api/reviews — отзывы
- Admin routes /api/admin/reviews/*
- POST /api/ai — простой ИИ-ответ

## Переменные окружения (в ONREZA)

```
TG_TOKEN=
TG_CHAT_ID=
ADMIN_PASSWORD=
DATABASE_URL=
ALLOWED_ORIGIN=https://xlmnr.ru
```

## Запуск

```bash
npm install
npm start
```
