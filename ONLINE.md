# Use Aevori with friends

Team access is implemented and tested locally. No tunnel, domain, or public port
is enabled automatically.

## On the main Mac

1. Keep Aevori and Ollama running. Optionally connect more Macs through the Mac pool.
2. Set up an HTTPS reverse proxy or tunnel forwarding to `127.0.0.1:5190`. It must preserve the public `Host` header and set `X-Forwarded-For`; otherwise Aevori rejects the connection. Port 5190 stays bound to loopback.
3. Under **Team → Your HTTPS address**, save the actual base address, such as `https://aevori.example.com`. Saving an address does not create a tunnel.
4. Under **Invite friends**, create a separate name and link for each person. Send the link to that person yourself. The invitation token is in the URL fragment, which is not sent in HTTP URL logs.
5. The recipient accepts the invitation in their browser. Each link works once and expires after 24 hours. The browser receives a seven-day HttpOnly session cookie. Revoking access also stops that person's running requests.

Example Caddy configuration on a main Mac with an already configured, reachable domain:

```caddyfile
aevori.example.com {
  reverse_proxy 127.0.0.1:5190
}
```

This example is not a deployed configuration. DNS, HTTPS, and network reachability
must match your environment. An external proxy needs a secure tunnel back to the
main Mac. Do not expose Ollama or port 11434 publicly.

## On a phone

Open your invitation using your workspace's HTTPS address. Aevori shows the
Home Screen installation guide. On iPhone, use **Safari → Share → Add to Home
Screen**, then open the new icon. Android browsers may offer **Install app**.
Keep the host Mac, AEVORI, and your HTTPS route running. Your phone is a client;
local AI still runs on the Mac. There is no public hosted AEVORI AI backend.

## Permissions and data

- The main Mac manages models, connections, pool sharing, device readings, and the team.
- Friends can use available models and the pool, and see presence and usage statistics. They cannot access the process list, app icons, model installation, provider keys, or device settings. Private system context is blocked on the server.
- Chats, notes, and tasks remain in each person's browser. The team does not see message content.
- Usage reports show actual duration and provider-reported tokens. Missing values or interrupted responses show “—”.
- Each friend can run up to two requests at once; the host can run four. The pool routes whole requests and does not combine GPU or RAM capacity.
- In the downloadable edition, session and invitation hashes are stored in `~/Library/Application Support/Aevori/`; with `npm start`, they are in `.aevori/team-5190.json`. They never belong in `public` or `dist`. Exclude `.aevori` when copying a source checkout to another Mac.
- An expired session needs a new invitation. Email sign-in and automatic emails are not supported.

[Back to Aevori](README.md) · [Connect several Macs](docs/MAC-POOL.md)
