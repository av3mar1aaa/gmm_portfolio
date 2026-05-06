// Cloudflare Worker URL для синхронизации state.json (см. worker/README.md)
// После деплоя замените значение на URL из вывода `wrangler deploy`
var WORKER_URL = 'https://gmm-portfolio-sync.mishzap201.workers.dev';

// Yandex Object Storage (S3-совместимое хранилище для медиафайлов)
var YOS_BUCKET = 'gmm';
var YOS_ENDPOINT = 'https://storage.yandexcloud.net';
