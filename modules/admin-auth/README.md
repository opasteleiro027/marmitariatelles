# Acesso administrativo

Autentica administradores ativos com credenciais individuais derivadas por
`scrypt` e armazenadas no PostgreSQL. As variáveis `ADMIN_EMAILS` e
`ADMIN_PASSWORD` permanecem como compatibilidade para a conta administrativa
original. A sessão é assinada por HMAC, expira em 12 horas e usa cookie
`httpOnly`.
