import QRCode from 'qrcode';

function computeCRC16(payload) {
  const polynomial = 0x1021;
  let crc = 0xFFFF;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
    }
  }

  return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

function formatField(id, value) {
  const length = value.length.toString().padStart(2, '0');
  return `${id}${length}${value}`;
}

function formatPixKey(keyType, key) {
  let cleanKey = key.trim();
  
  switch (keyType) {
    case 'cpf':
    case 'cnpj':
      cleanKey = cleanKey.replace(/\D/g, '');
      break;
    case 'celular':
      cleanKey = cleanKey.replace(/\D/g, '');
      if (!cleanKey.startsWith('55')) {
        cleanKey = '55' + cleanKey;
      }
      cleanKey = '+' + cleanKey;
      break;
    case 'email':
      cleanKey = cleanKey.toLowerCase();
      break;
  }
  
  return cleanKey;
}

export function generatePixPayload(options) {
  const {
    pixKey,
    keyType,
    merchantName,
    merchantCity,
    amount,
    transactionId = '***'
  } = options;

  const formattedKey = formatPixKey(keyType, pixKey);
  const gui = formatField('00', 'br.gov.bcb.pix');
  const keyField = formatField('01', formattedKey);
  const merchantAccountInfo = formatField('26', gui + keyField);

  let payload = '';
  payload += formatField('00', '01');
  payload += formatField('01', amount ? '12' : '11');
  payload += merchantAccountInfo;
  payload += formatField('52', '0000');
  payload += formatField('53', '986');
  
  if (amount && amount > 0) {
    payload += formatField('54', Number(amount).toFixed(2));
  }
  
  payload += formatField('58', 'BR');
  
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 25)
    .toUpperCase();
  payload += formatField('59', cleanName);
  
  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .substring(0, 15)
    .toUpperCase();
  payload += formatField('60', cleanCity);
  
  const txId = formatField('05', transactionId);
  payload += formatField('62', txId);
  
  payload += '6304';
  const crc = computeCRC16(payload);
  payload = payload.slice(0, -4) + formatField('63', crc);
  
  return payload;
}

export async function generatePixQRCodeDataUrl(options) {
  const payload = generatePixPayload(options);
  
  return await QRCode.toDataURL(payload, {
    type: 'image/png',
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    },
    errorCorrectionLevel: 'M'
  });
}
