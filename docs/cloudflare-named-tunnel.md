# Cloudflare Named Tunnel (Permanent URL)

A named tunnel gives you a fixed URL that never changes across restarts.
You need a free Cloudflare account and a domain managed by Cloudflare.
If you don't have a domain, use `cfargotunnel.com` (Cloudflare's free subdomain service).

---

## Step 1 — Create a Cloudflare account

1. Go to **cloudflare.com** → Sign up (free, no credit card)
2. You don't need a domain for a basic tunnel subdomain

---

## Step 2 — Log in with cloudflared

```bash
/tmp/cloudflared tunnel login
```

Opens a browser. Authorize it. Credentials saved to `~/.cloudflared/cert.pem`.

---

## Step 3 — Create a named tunnel

```bash
/tmp/cloudflared tunnel create colorization-study
```

This outputs a tunnel ID (UUID). Note it down.

---

## Step 4 — Create tunnel config

Create `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR_TUNNEL_ID>
credentials-file: /home/<you>/.cloudflared/<YOUR_TUNNEL_ID>.json

ingress:
  - hostname: colorization-study.cfargotunnel.com
    service: http://localhost:7788
  - service: http_status:404
```

Replace `<YOUR_TUNNEL_ID>` and `<you>` with your actual values.

---

## Step 5 — Route DNS

```bash
/tmp/cloudflared tunnel route dns colorization-study colorization-study.cfargotunnel.com
```

---

## Step 6 — Run the tunnel

```bash
nohup /tmp/cloudflared tunnel run colorization-study > /tmp/cloudflared.log 2>&1 &
```

Your study is now permanently at:
```
https://colorization-study.cfargotunnel.com
```

This URL survives restarts — just run `tunnel run` again after a reboot.

---

## Update restart.sh for named tunnel

Replace the cloudflared section in `restart.sh` with:

```bash
nohup /tmp/cloudflared tunnel run colorization-study > /tmp/cloudflared.log 2>&1 &
echo "URL: https://colorization-study.cfargotunnel.com"
```

And update `frontend/src/pages/Done.jsx`:
```js
const STUDY_URL = 'https://colorization-study.cfargotunnel.com';
```
Then rebuild: `cd frontend && npm run build`
