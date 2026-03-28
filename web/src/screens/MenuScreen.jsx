import React, { useState } from 'react';
import { useCartStore } from '../store/cartStore';

// Mock restaurant data
const MOCK_RESTAURANTS = {
  1: {
    id: 1,
    name: 'Pet Provisions',
    cuisine: 'Premium pet food & treats',
    rating: 4.5,
    deliveryTime: 30,
    menu: [
      { id: 1, name: 'Premium Dog Food (1kg)', price: 399, description: 'High-quality dry food' },
      { id: 2, name: 'Cat Wet Food (400g)', price: 199, description: 'Nutritious wet food' },
      { id: 3, name: 'Dog Treats Pack', price: 299, description: 'Organic treats' },
      { id: 4, name: 'Bird Food Mix', price: 149, description: 'Balanced bird nutrition' },
    ],
  },
  2: {
    id: 2,
    name: 'Pawsome Pantry',
    cuisine: 'Fresh & organic pet food',
    rating: 4.8,
    deliveryTime: 25,
    menu: [
      { id: 5, name: 'Organic Puppy Food', price: 449, description: 'For puppies 2-12 months' },
      { id: 6, name: 'Senior Dog Food', price: 399, description: 'For senior dogs' },
      { id: 7, name: 'Cat Supplement', price: 259, description: 'Vitamin & mineral supplement' },
      { id: 8, name: 'Rabbit Food', price: 179, description: 'Fresh hay & pellets' },
    ],
  },
};

export function MenuScreen({ restaurantId, onBack }) {
  const restaurant = MOCK_RESTAURANTS[restaurantId];
  const { addItem, items, getItemCount } = useCartStore();
  const [addedItems, setAddedItems] = useState({});

  if (!restaurant) {
    return (
      <div className="screen">
        <p>Restaurant not found</p>
        <button onClick={onBack} className="btn btn-secondary">
          Back
        </button>
      </div>
    );
  }

  const handleAddItem = (item) => {
    addItem(item);
    setAddedItems((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  return (
    <div className="screen menu-screen">
      <button onClick={onBack} className="back-btn">← Back</button>

      <div className="restaurant-header">
        <h1>{restaurant.name}</h1>
        <p>{restaurant.cuisine}</p>
        <div className="restaurant-meta">
          <span>★ {restaurant.rating}</span>
          <span>• {restaurant.deliveryTime} min</span>
        </div>
      </div>

      <h2>Menu</h2>
      <div className="menu-items">
        {restaurant.menu.map((item) => (
          <div key={item.id} className="menu-item">
            <div className="item-info">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p className="item-price">₹{item.price}</p>
            </div>
            <button
              className="add-btn"
              onClick={() => handleAddItem(item)}
            >
              {addedItems[item.id] ? `Added (${addedItems[item.id]})` : 'Add'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
