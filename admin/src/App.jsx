import React from 'react';
import { api, clearPartnerSession, setPartnerSession, uploadFileToSignedUrl } from './api';

const emptyMenuItem = {
  name: '',
  description: '',
  price: 0,
  image: '',
  isVeg: false,
  isBestseller: false,
  isAvailable: true,
};

const statusOptions = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
const ORDER_POLL_INTERVAL_MS = 5000;
const ALERT_SOUND_INTERVAL_MS = 1200;
const MIN_IMAGE_WIDTH = 720;
const MIN_IMAGE_HEIGHT = 720;

export default function App() {
  const [restaurantId, setRestaurantId] = React.useState(localStorage.getItem('partner_restaurant_id') || '1');
  const [partnerKey, setPartnerKey] = React.useState(localStorage.getItem('partner_key') || 'partner-1');
  const [authenticated, setAuthenticated] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('menu');
  const [loading, setLoading] = React.useState(false);
  const [uploadingImage, setUploadingImage] = React.useState(false);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [imageValidationMessage, setImageValidationMessage] = React.useState('');

  const [restaurant, setRestaurant] = React.useState(null);
  const [menuItems, setMenuItems] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [editingMenuItemId, setEditingMenuItemId] = React.useState(null);
  const [alertOrder, setAlertOrder] = React.useState(null);
  const [alertSecondsRemaining, setAlertSecondsRemaining] = React.useState(0);
  const [menuForm, setMenuForm] = React.useState(emptyMenuItem);
  const [availabilityForm, setAvailabilityForm] = React.useState({
    isOpen: true,
    openingTime: '09:00',
    closingTime: '23:00',
  });
  const seenPlacedOrderIdsRef = React.useRef(new Set());
  const ringIntervalRef = React.useRef(null);
  const attemptedSessionRestoreRef = React.useRef(false);

  const run = React.useCallback(async (fn, successMessage) => {
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await fn();
      if (successMessage) setMessage(successMessage);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, []);

  const playRingTone = React.useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.06;
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 180);
    } catch {
      // Browser audio may be blocked until user interaction.
    }
  }, []);

  const stopRinging = React.useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
  }, []);

  const startRinging = React.useCallback(() => {
    stopRinging();
    playRingTone();
    ringIntervalRef.current = setInterval(playRingTone, ALERT_SOUND_INTERVAL_MS);
  }, [playRingTone, stopRinging]);

  const showDesktopNotification = React.useCallback((order) => {
    if (!('Notification' in window)) {
      return;
    }
    if (Notification.permission !== 'granted') {
      return;
    }
    const body = `Order #${order.id} · ₹${order.grandTotal} · Accept within 30s`;
    const notification = new Notification(`New order for ${restaurant?.name || 'your restaurant'}`, { body });
    notification.onclick = () => {
      window.focus();
      setActiveTab('orders');
    };
  }, [restaurant?.name]);

  const openOrderAlert = React.useCallback((order) => {
    setAlertOrder(order);
    setAlertSecondsRemaining(Math.max(0, Number(order.acceptanceSecondsRemaining || 30)));
    setActiveTab('orders');
    startRinging();
    showDesktopNotification(order);
  }, [showDesktopNotification, startRinging]);

  const closeOrderAlert = React.useCallback(() => {
    setAlertOrder(null);
    setAlertSecondsRemaining(0);
    stopRinging();
  }, [stopRinging]);

  const handleOrdersSnapshot = React.useCallback((ordersData) => {
    const list = ordersData || [];
    setOrders(list);

    const activePlaced = list
      .filter((order) => order.status === 'placed' && Number(order.acceptanceSecondsRemaining || 0) > 0)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (alertOrder) {
      const latest = activePlaced.find((o) => String(o.id) === String(alertOrder.id));
      if (latest) {
        setAlertOrder(latest);
        setAlertSecondsRemaining(Math.max(0, Number(latest.acceptanceSecondsRemaining || 0)));
        return;
      }
      closeOrderAlert();
    }

    const nextOrder = activePlaced.find((order) => !seenPlacedOrderIdsRef.current.has(String(order.id)));
    if (!nextOrder) {
      return;
    }
    seenPlacedOrderIdsRef.current.add(String(nextOrder.id));
    openOrderAlert(nextOrder);
  }, [alertOrder, closeOrderAlert, openOrderAlert]);

  const loadPortal = React.useCallback(() => run(async () => {
    const [me, menu, ordersData] = await Promise.all([api.me(), api.menuItems(), api.orders()]);
    setRestaurant(me || null);
    setAvailabilityForm({
      isOpen: Boolean(me?.isOpen),
      openingTime: me?.openingTime || '09:00',
      closingTime: me?.closingTime || '23:00',
    });
    setMenuItems(menu || []);
    handleOrdersSnapshot(ordersData || []);
    setAuthenticated(true);
  }), [handleOrdersSnapshot, run]);

  const refreshOrders = React.useCallback(async () => {
    const ordersData = await api.orders();
    handleOrdersSnapshot(ordersData || []);
  }, [handleOrdersSnapshot]);

  const login = async () => {
    setPartnerSession({ restaurantId, partnerKey });
    await loadPortal();
  };

  const logout = () => {
    clearPartnerSession();
    setAuthenticated(false);
    setRestaurant(null);
    setMenuItems([]);
    setOrders([]);
    closeOrderAlert();
    stopRinging();
    setError('');
    setMessage('');
  };

  const createMenuItem = async (e) => {
    e.preventDefault();
    await run(async () => {
      const payload = {
        ...menuForm,
        price: Number(menuForm.price),
      };
      if (editingMenuItemId) {
        await api.updateMenuItem(editingMenuItemId, payload);
      } else {
        await api.createMenuItem(payload);
      }
      setMenuForm(emptyMenuItem);
      setEditingMenuItemId(null);
      await loadPortal();
    }, editingMenuItemId ? 'Menu item updated' : 'Menu item created');
  };

  const startEditMenuItem = (item) => {
    setEditingMenuItemId(item.id);
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      price: Number(item.price || 0),
      image: item.image || '',
      isVeg: Boolean(item.isVeg),
      isBestseller: Boolean(item.isBestseller),
      isAvailable: Boolean(item.isAvailable),
    });
  };

  const cancelEditMenuItem = () => {
    setEditingMenuItemId(null);
    setMenuForm(emptyMenuItem);
  };

  const handleImageFilePick = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setImageValidationMessage('');

    await run(async () => {
      setUploadingImage(true);
      const dimensions = await new Promise((resolve, reject) => {
        const img = new Image();
        const tempUrl = URL.createObjectURL(file);
        img.onload = () => {
          const out = { width: img.naturalWidth, height: img.naturalHeight };
          URL.revokeObjectURL(tempUrl);
          resolve(out);
        };
        img.onerror = () => {
          URL.revokeObjectURL(tempUrl);
          reject(new Error('Unable to read image. Please choose a valid image file.'));
        };
        img.src = tempUrl;
      });
      if (dimensions.width < MIN_IMAGE_WIDTH || dimensions.height < MIN_IMAGE_HEIGHT) {
        throw new Error(`Image is too small (${dimensions.width}x${dimensions.height}). Use at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT}.`);
      }

      const uploadInit = await api.createMenuItemUploadUrl({
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
      });
      await uploadFileToSignedUrl(uploadInit.uploadUrl, file, uploadInit.contentType || file.type);
      setMenuForm((prev) => ({ ...prev, image: uploadInit.publicUrl }));
    }, 'Image uploaded');

    setImageValidationMessage(`Image validated: min ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} and uploaded successfully.`);
    setUploadingImage(false);
    event.target.value = '';
  };

  const updateStatus = async (orderId, status) => {
    await run(async () => {
      await api.updateOrderStatus(orderId, status);
      await refreshOrders();
    }, 'Order status updated');
  };

  const acceptAlertOrder = async () => {
    if (!alertOrder) {
      return;
    }
    const orderId = alertOrder.id;
    closeOrderAlert();
    await run(async () => {
      await api.updateOrderStatus(orderId, 'preparing');
      await refreshOrders();
    }, 'Order accepted and moved to preparing');
  };

  const cancelAlertOrder = React.useCallback(async () => {
    if (!alertOrder) {
      return;
    }
    const orderId = alertOrder.id;
    closeOrderAlert();
    await run(async () => {
      await api.updateOrderStatus(orderId, 'cancelled');
      await refreshOrders();
    }, 'Order auto-cancelled');
  }, [alertOrder, closeOrderAlert, refreshOrders, run]);

  const updateAvailability = async (e) => {
    e.preventDefault();
    await run(async () => {
      await api.updateAvailability({
        isOpen: availabilityForm.isOpen,
        openingTime: availabilityForm.openingTime,
        closingTime: availabilityForm.closingTime,
      });
      await loadPortal();
    }, 'Restaurant availability updated');
  };

  React.useEffect(() => {
    if (!authenticated) {
      return undefined;
    }
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    const timer = setInterval(() => {
      refreshOrders().catch(() => {});
    }, ORDER_POLL_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [authenticated, refreshOrders]);

  React.useEffect(() => {
    if (!alertOrder) {
      return undefined;
    }
    if (alertSecondsRemaining <= 0) {
      cancelAlertOrder();
      return undefined;
    }
    const timer = setInterval(() => {
      setAlertSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [alertOrder, alertSecondsRemaining, cancelAlertOrder]);

  React.useEffect(() => () => stopRinging(), [stopRinging]);

  React.useEffect(() => {
    if (attemptedSessionRestoreRef.current) {
      return;
    }
    attemptedSessionRestoreRef.current = true;
    const savedRestaurantId = localStorage.getItem('partner_restaurant_id');
    const savedPartnerKey = localStorage.getItem('partner_key');
    if (!savedRestaurantId || !savedPartnerKey) {
      return;
    }
    loadPortal().catch(() => {
      clearPartnerSession();
    });
  }, [loadPortal]);

  if (!authenticated) {
    return (
      <div className="app">
        <header className="header"><h1>Dwiggy Restaurant Console</h1></header>
        <section className="panel" style={{ maxWidth: 420 }}>
          <h2>Partner Login</h2>
          <p className="hint">Use your restaurant ID and partner key.</p>
          <div className="form">
            <input value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)} placeholder="Restaurant ID" />
            <input value={partnerKey} onChange={(e) => setPartnerKey(e.target.value)} placeholder="Partner Key" />
            <button onClick={login}>Enter Console</button>
          </div>
          {error && <p className="error">{error}</p>}
        </section>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Dwiggy Restaurant Console</h1>
          <p className="hint">{restaurant?.name} (ID: {restaurant?.id})</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <nav className="tabs">
        {['availability', 'menu', 'orders'].map((tab) => (
          <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </nav>

      {loading && <p className="info">Loading...</p>}
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}

      {alertOrder ? (
        <section className="orderAlert">
          <div className="orderAlertHead">
            <h3>New order #{alertOrder.id}</h3>
            <span className="orderAlertTimer">{alertSecondsRemaining}s</span>
          </div>
          <p className="orderAlertText">
            Total ₹{alertOrder.grandTotal}. Accept within 30 seconds or it will be cancelled.
          </p>
          <div className="orderAlertActions">
            <button className="orderAlertAccept" onClick={acceptAlertOrder}>Accept (Preparing)</button>
            <button onClick={cancelAlertOrder}>Cancel Now</button>
          </div>
        </section>
      ) : null}

      {activeTab === 'availability' && (
        <section className="panel">
          <h2>Store Availability</h2>
          <form className="form" onSubmit={updateAvailability}>
            <label>
              <input
                type="checkbox"
                checked={availabilityForm.isOpen}
                onChange={(e) => setAvailabilityForm({ ...availabilityForm, isOpen: e.target.checked })}
              />
              Open Now
            </label>
            <input
              required
              type="time"
              value={availabilityForm.openingTime}
              onChange={(e) => setAvailabilityForm({ ...availabilityForm, openingTime: e.target.value })}
            />
            <input
              required
              type="time"
              value={availabilityForm.closingTime}
              onChange={(e) => setAvailabilityForm({ ...availabilityForm, closingTime: e.target.value })}
            />
            <button type="submit">Save Availability</button>
          </form>
          <p className="hint">
            Current: {availabilityForm.isOpen ? 'Open' : 'Closed'} · {availabilityForm.openingTime} - {availabilityForm.closingTime}
          </p>
        </section>
      )}

      {activeTab === 'menu' && (
        <section className="panel">
          <h2>{editingMenuItemId ? `Edit Menu Item #${editingMenuItemId}` : 'Upload Menu Item'}</h2>
          <form className="form" onSubmit={createMenuItem}>
            <input required placeholder="Name" value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} />
            <input required placeholder="Description" value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} />
            <input required type="number" step="0.01" placeholder="Price" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} />
            <input required placeholder="Image URL" value={menuForm.image} onChange={(e) => setMenuForm({ ...menuForm, image: e.target.value })} />
            <label>
              Dish Image File
              <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageFilePick} />
            </label>
            <p className="hint">Recommended image: square, at least {MIN_IMAGE_WIDTH}x{MIN_IMAGE_HEIGHT}</p>
            {imageValidationMessage ? <p className="success">{imageValidationMessage}</p> : null}
            {uploadingImage ? <p className="hint">Uploading image...</p> : null}
            <label><input type="checkbox" checked={menuForm.isVeg} onChange={(e) => setMenuForm({ ...menuForm, isVeg: e.target.checked })} /> Veg</label>
            <label><input type="checkbox" checked={menuForm.isBestseller} onChange={(e) => setMenuForm({ ...menuForm, isBestseller: e.target.checked })} /> Bestseller</label>
            <label><input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} /> Available</label>
            <button type="submit">{editingMenuItemId ? 'Save Changes' : 'Upload Item'}</button>
            {editingMenuItemId ? <button type="button" onClick={cancelEditMenuItem}>Cancel Edit</button> : null}
          </form>

          <div className="menuLayout">
            <div>
              <h3>Current Menu</h3>
              <table>
                <thead><tr><th>Name</th><th>Price</th><th>Available</th><th></th></tr></thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>₹{item.price}</td>
                      <td>{String(item.isAvailable)}</td>
                      <td>
                        <button onClick={() => startEditMenuItem(item)}>Edit</button>
                        <button
                          onClick={() =>
                            run(async () => {
                              await api.deleteMenuItem(item.id);
                              if (String(editingMenuItemId) === String(item.id)) {
                                cancelEditMenuItem();
                              }
                              await loadPortal();
                            }, 'Menu item deleted')
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="phoneWrap">
              <h3>Mobile Preview</h3>
              <div className="phoneFrame">
                <div className="phoneNotch" />
                <div className="phoneScreen">
                  <div className="previewHeader">
                    <div>
                      <div className="previewTitle">{restaurant?.name || 'Restaurant'}</div>
                      <div className="previewSub">{restaurant?.tagline || 'Your menu on Dwiggy app'}</div>
                    </div>
                    <div className={`previewOpen ${availabilityForm.isOpen ? 'open' : 'closed'}`}>
                      {availabilityForm.isOpen ? 'Open' : 'Closed'}
                    </div>
                  </div>

                  <div className="previewMenuTitle">Menu</div>
                  <div className="previewList">
                    {menuItems.filter((item) => item.isAvailable).map((item) => (
                      <div key={`preview-${item.id}`} className="previewItem">
                        <div className="previewInfo">
                          <div className="previewVegLine">
                            <span className={`previewVegIcon ${item.isVeg ? 'veg' : 'nonVeg'}`} />
                          </div>
                          {item.isBestseller ? <div className="previewBadge">Bestseller</div> : null}
                          <div className="previewName">{item.name}</div>
                          <div className="previewPrice">₹{item.price}</div>
                          <div className="previewDesc">{item.description}</div>
                        </div>
                        <div className="previewRight">
                          <div className="previewThumbWrap">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="previewThumb" />
                            ) : (
                              <div className="previewThumbFallback">No image</div>
                            )}
                          </div>
                          <button className={`previewAddBtn ${availabilityForm.isOpen ? '' : 'disabled'}`} disabled={!availabilityForm.isOpen}>
                            {availabilityForm.isOpen ? 'ADD' : 'CLOSED'}
                          </button>
                        </div>
                      </div>
                    ))}
                    {menuItems.filter((item) => item.isAvailable).length === 0 ? (
                      <div className="previewEmpty">No available items to preview</div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'orders' && (
        <section className="panel">
          <h2>Order Tracking</h2>
          <table>
            <thead><tr><th>Order</th><th>Status</th><th>Total</th><th>Decision</th><th>Update</th></tr></thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{order.status}</td>
                  <td>₹{order.grandTotal}</td>
                  <td>{order.status === 'placed' ? `${order.acceptanceSecondsRemaining || 0}s` : '-'}</td>
                  <td>
                    <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
