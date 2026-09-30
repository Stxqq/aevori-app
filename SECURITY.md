# Security

AEVORI 0.3 is preview software for local use. Its server binds to loopback and
checks Host/Origin before private API access. Remote use requires deliberately
configured HTTPS and an invitation. Do not expose Ollama or the local port
through an unauthenticated proxy.

Use GitHub private vulnerability reporting on this repository for security
reports. Never include real API keys, invitations, chat history or credentials
in public issues. Provide a minimal reproduction with synthetic data.

Local data is not encrypted by AEVORI. A local user or program with access to
your files/browser profile may read it. This is not a hardened multi-tenant
hosted service. Browser speech recognition may use vendor cloud services.
