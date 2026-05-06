# Cloudflare Worker для синхронизации портфолио

Хранит `state.json` в Cloudflare KV. Заменяет старую схему с GitHub-токенами:
все посетители видят одну и ту же версию, токены в браузере не нужны.

## Эндпоинты

| Метод | Путь          | Что делает                                | Auth                      |
|-------|---------------|-------------------------------------------|---------------------------|
| GET   | `/api/fetch`  | Отдаёт текущий state (или `null`)         | нет                       |
| POST  | `/api/save`   | Сохраняет `{ state: {...} }` в KV         | `X-Editor-Password` header|
| POST  | `/api/reset`  | Удаляет state из KV                       | `X-Editor-Password` header|

## Деплой (один раз)

```bash
cd worker

# 1. Поставить wrangler (если ещё нет)
npm install -g wrangler

# 2. Авторизоваться в Cloudflare
wrangler login

# 3. Создать KV namespace — скопировать выданный id
wrangler kv namespace create PORTFOLIO_KV

# 4. Открыть wrangler.toml и заменить REPLACE_WITH_KV_NAMESPACE_ID на id из шага 3

# 5. Записать пароль редактора как секрет (тот же пароль, что вводите в модалке сайта)
wrangler secret put EDITOR_PASSWORD
# вставить пароль, нажать Enter

# 6. Задеплоить
wrangler deploy
# вывод: https://gmm-portfolio-sync.<ВАШ-САБДОМЕН>.workers.dev
```

## После деплоя

1. Скопируйте URL из вывода `wrangler deploy`
2. Откройте `../cloud-config.js` и подставьте URL в `WORKER_URL`
3. Если у вас уже есть данные в `../data/state.json` — залейте их в KV один раз:

```bash
curl -X POST https://gmm-portfolio-sync.<ВАШ-САБДОМЕН>.workers.dev/api/save \
  -H "Content-Type: application/json" \
  -H "X-Editor-Password: ВАШ_ПАРОЛЬ" \
  --data-binary @<(echo '{"state":'"$(cat ../data/state.json)"'}')
```

(Если такой синтаксис не работает — соберите JSON руками: `{"state": <содержимое state.json>}`.)

## Проверка

```bash
# Должен вернуть JSON state'а или null
curl https://gmm-portfolio-sync.<ВАШ-САБДОМЕН>.workers.dev/api/fetch
```

## Локальная разработка

```bash
wrangler dev
# Worker поднимется на http://localhost:8787
# В cloud-config.js временно поставьте WORKER_URL = 'http://localhost:8787'
```

## Лимиты бесплатного тарифа

- 100 000 запросов/день
- KV: 25 MB на ключ, 1 запись/сек на ключ
- Текущий `state.json` ~4 MB — с запасом
