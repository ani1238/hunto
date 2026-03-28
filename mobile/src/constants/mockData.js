export const BANNERS = [
  {
    id: 'b1',
    image: 'https://images.unsplash.com/photo-1601758125946-6ec2ef64daf8?w=800',
    title: '50% OFF on First Order!',
    subtitle: 'Use code PAWFIRST',
  },
  {
    id: 'b2',
    image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
    title: 'Free Delivery This Weekend',
    subtitle: 'On orders above ₹199',
  },
  {
    id: 'b3',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
    title: 'New: Homemade Treats!',
    subtitle: 'Freshly prepared daily',
  },
];

export const CATEGORIES = [
  { id: 'c1', name: 'Dogs', emoji: '🐕' },
  { id: 'c6', name: 'All Pets', emoji: '🐾' },
];

export const LOCATIONS = [
  { id: 'l1', label: 'Banjara Hills, Hyderabad', city: 'Hyderabad', isServiceable: true, latitude: 17.4265, longitude: 78.4408 },
  { id: 'l2', label: 'Gachibowli, Hyderabad', city: 'Hyderabad', isServiceable: true, latitude: 17.4366, longitude: 78.3489 },
  { id: 'l3', label: 'Madhapur, Hyderabad', city: 'Hyderabad', isServiceable: true, latitude: 17.4422, longitude: 78.3912 },
  { id: 'l4', label: 'Kondapur, Hyderabad', city: 'Hyderabad', isServiceable: true, latitude: 17.4449, longitude: 78.3834 },
  { id: 'l5', label: 'Bandlaguda Jagir, Hyderabad', city: 'Hyderabad', isServiceable: true, latitude: 17.3130, longitude: 78.4327 },
  { id: 'l6', label: 'Jubilee Hills, Hyderabad', city: 'Hyderabad', isServiceable: true, latitude: 17.4257, longitude: 78.4292 },
  { id: 'l7', label: 'Koramangala, Bangalore', city: 'Bangalore', isServiceable: false, latitude: 12.9352, longitude: 77.6170 },
  { id: 'l7', label: 'Hinjewadi, Pune', city: 'Pune', isServiceable: false, latitude: 18.5914, longitude: 73.7423 },
];

export const RESTAURANTS = [
  {
    id: 'r1',
    name: "Pawsome Kitchen",
    tagline: 'Fresh homemade meals only for dogs',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
    rating: 4.8,
    reviewCount: 320,
    deliveryTime: '25–35 min',
    deliveryFee: 'Free delivery',
    minOrder: 149,
    distance: '1.2 km',
    latitude: 17.3130,
    longitude: 78.4327,
    tags: ['Dogs', 'Fresh', 'Protein-rich'],
    isOpen: true,
    isPromoted: true,
    discount: '30% off up to ₹75',
    menu: [
      {
        id: 'm1',
        name: 'Chicken & Rice Bowl',
        description: 'Boiled chicken breast with brown rice and veggies',
        price: 149,
        image: 'https://images.unsplash.com/photo-1518977822534-7049a61ee0c2?w=400',
        isVeg: false,
        isBestseller: true,
      },
      {
        id: 'm2',
        name: 'Mutton Power Bowl',
        description: 'Tender mutton with millet, pumpkin and minerals',
        price: 179,
        image: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400',
        isVeg: false,
        isBestseller: true,
      },
      {
        id: 'm3',
        name: 'Peanut Butter Dog Cookies',
        description: 'Baked crunchy treats with oats and peanut butter',
        price: 99,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
        isVeg: true,
        isBestseller: true,
      },
    ],
  },
];
