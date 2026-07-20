export const CATEGORIES = [
  { id: 1, name: "Silk Scarves", slug: "silk-scarves", description: "Premium pure silk scarves with soft texture and elegant shine" },
  { id: 2, name: "Chiffon Hijabs", slug: "chiffon-hijabs", description: "Lightweight and breathable georgette chiffon hijabs" },
  { id: 3, name: "Modal Scarves", slug: "modal-scarves", description: "Ultra-soft modal blend everyday essentials" },
  { id: 4, name: "Luxury Collection", slug: "luxury-collection", description: "Exclusive gold embroidered masterpieces" }
];

export const PRODUCTS = [
  {
    id: 1,
    name: "Luminous Gold Silk Scarf",
    description: "Woven with fine Tekon Gold silk threads, this scarf reflects the spiritual essence of 'An-Nur' (The Light). Exquisite drape and natural radiance make it a perfect statement piece for special occasions.",
    original_price: 180.00,
    discounted_price: 153.00,
    discount_active: true,
    primary_image_url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600",
    images: [
      { id: 101, url: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&q=80&w=600", is_primary: true, sort_order: 0 }
    ],
    stock: 25,
    category: "Silk Scarves",
    category_slug: "silk-scarves",
    category_id: 1
  },
  {
    id: 2,
    name: "Aura Premium Chiffon",
    description: "Premium double-loop chiffon with standard editorial dimensions. Non-slip, lightweight texture that offers complete opacity when draped.",
    original_price: 45.00,
    discounted_price: null,
    discount_active: false,
    primary_image_url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600",
    images: [
      { id: 102, url: "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&q=80&w=600", is_primary: true, sort_order: 0 }
    ],
    stock: 12,
    category: "Chiffon Hijabs",
    category_slug: "chiffon-hijabs",
    category_id: 2
  },
  {
    id: 3,
    name: "Ethereal Sand Modal Scarf",
    description: "Crafted from certified organic modal fibers, presenting an incredibly soft touch against the skin. Features raw edge details for a modern, relaxed aesthetic.",
    original_price: 38.00,
    discounted_price: null,
    discount_active: false,
    primary_image_url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600",
    images: [
      { id: 103, url: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=600", is_primary: true, sort_order: 0 }
    ],
    stock: 40,
    category: "Modal Scarves",
    category_slug: "modal-scarves",
    category_id: 3
  },
  {
    id: 4,
    name: "Royal Golden Embroidered Shawl",
    description: "An editorial masterpiece featuring handcrafted embroidery and delicate beadwork along the borders. A true luxurious heritage artifact.",
    original_price: 250.00,
    discounted_price: 200.00,
    discount_active: true,
    primary_image_url: "https://images.unsplash.com/photo-1583391265517-35bbdad01209?auto=format&fit=crop&q=80&w=600",
    images: [
      { id: 104, url: "https://images.unsplash.com/photo-1583391265517-35bbdad01209?auto=format&fit=crop&q=80&w=600", is_primary: true, sort_order: 0 }
    ],
    stock: 5,
    category: "Luxury Collection",
    category_slug: "luxury-collection",
    category_id: 4
  }
];

export const SETTINGS = {
  sale_active: "true",
  discount_active: "true",
  discount_percent: "15",
  custom_sale_text: "15% off on select silk collections",
  snappycart_sync_enabled: "false",
  whatsapp_number: "+966500000000"
};
