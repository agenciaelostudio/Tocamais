# Deploy da `tocamais.app` na VPS Linux

Este projeto agora sobe como frontend estatico em `Vite`, com backend gerenciado no `Supabase`.

## O que ja esta pronto

- exemplo de variaveis em [`.env.production.example`](/C:/Users/Nathan/Documents/GitHub/maismais/.env.production.example)
- script de deploy em [`deploy/deploy.sh`](/C:/Users/Nathan/Documents/GitHub/maismais/deploy/deploy.sh)
- configuracao do Nginx em [`deploy/nginx/tocamais.app.conf`](/C:/Users/Nathan/Documents/GitHub/maismais/deploy/nginx/tocamais.app.conf)
- setup do Supabase em [SUPABASE_SETUP.md](/C:/Users/Nathan/Documents/GitHub/maismais/SUPABASE_SETUP.md)

## Premissas

- VPS Ubuntu/Debian com acesso `sudo`
- DNS de `tocamais.app` e `www.tocamais.app` apontando para o IP da VPS
- Node 20+ instalado
- Nginx instalado
- projeto Supabase configurado

## 1. Preparar o repositorio no servidor

```bash
sudo mkdir -p /var/www/tocamais.app/releases
sudo chown -R $USER:$USER /var/www/tocamais.app
cd /var/www
git clone <URL_DO_REPO> tocamais.app-source
cd tocamais.app-source
cp .env.production.example .env.production
```

## 2. Preencher o `.env.production`

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 3. Rodar o deploy

```bash
bash deploy/deploy.sh
```

O script:

- roda `npm ci`
- executa `npm run build`
- publica o `dist/` em `/var/www/tocamais.app/releases/<timestamp>`
- ativa `/var/www/tocamais.app/current`

## 4. Configurar Nginx

```bash
sudo cp deploy/nginx/tocamais.app.conf /etc/nginx/sites-available/tocamais.app.conf
sudo ln -s /etc/nginx/sites-available/tocamais.app.conf /etc/nginx/sites-enabled/tocamais.app.conf
sudo nginx -t
sudo systemctl reload nginx
```

## 5. Ativar HTTPS

Instrucao oficial:

- [Certbot para Nginx](https://certbot.eff.org/instructions?os=ubuntufocal&ws=nginx)

Fluxo tipico:

```bash
sudo snap install core
sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo certbot --nginx -d tocamais.app -d www.tocamais.app
sudo certbot renew --dry-run
```

## 6. Checklist final

- abrir `https://tocamais.app`
- confirmar cadastro/login pelo Supabase
- confirmar upload de imagem
- confirmar refresh em rotas como `/dashboard`
