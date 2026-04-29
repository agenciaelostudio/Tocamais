#!/usr/bin/env bash
set -Eeuo pipefail

APP_NAME="tocamais.app"
APP_DIR="/var/www/${APP_NAME}"
RELEASES_DIR="${APP_DIR}/releases"
CURRENT_LINK="${APP_DIR}/current"
TIMESTAMP="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}"
KEEP_RELEASES="${KEEP_RELEASES:-5}"

echo "[1/6] Checking required tools..."
command -v npm >/dev/null 2>&1 || { echo "npm nao encontrado"; exit 1; }
command -v rsync >/dev/null 2>&1 || { echo "rsync nao encontrado"; exit 1; }

if [[ ! -f ".env.production" ]]; then
  echo ".env.production nao encontrado na raiz do projeto."
  echo "Copie .env.production.example para .env.production antes de rodar."
  exit 1
fi

echo "[2/6] Installing dependencies..."
npm ci

echo "[3/6] Building production bundle..."
npm run build

echo "[4/6] Preparing release directory..."
sudo mkdir -p "${RELEASE_DIR}"
sudo mkdir -p "${RELEASES_DIR}"

echo "[5/6] Syncing dist/ to ${RELEASE_DIR}..."
sudo rsync -av --delete dist/ "${RELEASE_DIR}/"

echo "[6/6] Activating release..."
sudo ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"
sudo chown -R www-data:www-data "${APP_DIR}"

echo "Deployment finalizado em ${CURRENT_LINK}"

mapfile -t releases < <(find "${RELEASES_DIR}" -mindepth 1 -maxdepth 1 -type d | sort)
if (( ${#releases[@]} > KEEP_RELEASES )); then
  old_count=$(( ${#releases[@]} - KEEP_RELEASES ))
  for old_release in "${releases[@]:0:${old_count}}"; do
    echo "Removendo release antiga: ${old_release}"
    sudo rm -rf "${old_release}"
  done
fi
