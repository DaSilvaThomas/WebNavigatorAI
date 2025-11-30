function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

function isHttpsUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch (err) {
    return false;
  }
}

function getDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (err) {
    return '';
  }
}

function sanitizeUrl(url) {
  if (!url) return '';
  
  url = url.trim();
  
  if (url.startsWith('javascript:') || url.startsWith('data:') || url.startsWith('file:')) {
    return '';
  }
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  
  return url;
}

function getUrlProtocol(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol.replace(':', '');
  } catch (err) {
    return '';
  }
}