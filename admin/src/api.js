const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const getPartnerSession = () => ({
  restaurantId: localStorage.getItem('partner_restaurant_id') || '',
  partnerKey: localStorage.getItem('partner_key') || '',
});

export const setPartnerSession = ({ restaurantId, partnerKey }) => {
  localStorage.setItem('partner_restaurant_id', String(restaurantId || '').trim());
  localStorage.setItem('partner_key', String(partnerKey || '').trim());
};

export const clearPartnerSession = () => {
  localStorage.removeItem('partner_restaurant_id');
  localStorage.removeItem('partner_key');
};

async function request(path, options = {}) {
  const { restaurantId, partnerKey } = getPartnerSession();
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Restaurant-Id': restaurantId,
      'X-Partner-Key': partnerKey,
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(body?.message || `Request failed: ${response.status}`);
  }
  return body?.data;
}

export const api = {
  me: () => request('/api/partner/me'),
  updateAvailability: (payload) => request('/api/partner/availability', { method: 'PUT', body: JSON.stringify(payload) }),
  menuItems: () => request('/api/partner/menu-items'),
  createMenuItemUploadUrl: (payload) =>
    request('/api/partner/menu-items/upload-url', { method: 'POST', body: JSON.stringify(payload) }),
  createMenuItem: (payload) => request('/api/partner/menu-items', { method: 'POST', body: JSON.stringify(payload) }),
  updateMenuItem: (id, payload) => request(`/api/partner/menu-items/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteMenuItem: (id) => request(`/api/partner/menu-items/${id}`, { method: 'DELETE' }),
  orders: () => request('/api/partner/orders'),
  updateOrderStatus: (id, status) =>
    request(`/api/partner/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export async function uploadFileToSignedUrl(uploadUrl, file, contentType) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Image upload failed: ${response.status}`);
  }
}
