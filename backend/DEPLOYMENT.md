# Deployment and operations

## Production basics

- Set `CORS_ORIGIN` to the exact public frontend origin; do not use `*`.
- Put Flask behind a production WSGI server and HTTPS reverse proxy.
- Keep the database and logs outside public web directories.
- Do not use the seeded test accounts in production.
- Store secrets and configuration in environment variables.

## Health and logs

`GET /health` checks that the API can reach SQLite and returns `503` if it cannot.
Requests are written to `backend/topazion.log`, rotated after 1 MB, with five backups retained. Configure deployment monitoring to alert when `/health` is not `200` or the log contains repeated errors.

## Backups

Run this from PowerShell on a schedule:

```powershell
.\backend\backup.ps1
```

Copy backups to separate storage and periodically test restoring one. A backup on the same disk is not enough protection against disk failure or accidental deletion.