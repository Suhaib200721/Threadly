// backend/seedProducts.js
// ─────────────────────────────────────────────────────────────
// Run this script to add sample categories and products.
// Usage:  node seedProducts.js
//
// Run ONCE after connecting MongoDB. Safe to re-run
// (will skip existing data).
// ─────────────────────────────────────────────────────────────

require('dotenv').config();

const mongoose = require('mongoose');
const Category = require('./models/Category');
const Product = require('./models/Product');

// Using generated local images for accurate models and colours.
// In production replace with real product photos.

// ── Sample Categories ────────────────────────────────────────
const CATEGORIES = [
  { name: 'Oversized T-Shirts', description: 'Relaxed, dropped-shoulder oversized tees' },
  { name: 'Regular T-Shirts',   description: 'Classic fit everyday tees'                },
  { name: 'Graphic T-Shirts',   description: 'Bold prints and graphic designs'          },
  { name: 'Printed T-Shirts',   description: 'Custom text and pattern printed tees'     },
];

// ── Sample Products ──────────────────────────────────────────
// Built after categories are inserted so we have real _id values.
function buildProducts(cats) {
  // Helper to get a category _id by name
  const id = (name) => cats.find((c) => c.name === name)._id;

  return [
    // ── 1. Classic Oversized Tee ─────────────────────────────
    {
      name: 'Classic Oversized T-Shirt',
      description:
        'A timeless oversized tee made from 100% pure cotton. Relaxed fit with dropped shoulders and a clean crew neck. Perfect for everyday casual wear.',
      price: 549,
      category: id('Oversized T-Shirts'),
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colours: [
        { name: 'Black', image: '/images/p1_black.jpg' },
        { name: 'White', image: '/images/p1_white.jpg' },
        { name: 'Grey',  image: '/images/p1_grey.jpg'  },
      ],
      stock: 120,
      isActive: true,
    },

    // ── 2. Premium Cotton Oversized Tee ─────────────────────
    {
      name: 'Premium Cotton Oversized Tee',
      description:
        'Heavyweight 220 GSM premium cotton for a luxurious feel. Ribbed collar and cuffs. Oversized silhouette with a boxy cut.',
      price: 699,
      category: id('Oversized T-Shirts'),
      sizes: ['S', 'M', 'L', 'XL'],
      colours: [
        { name: 'Olive',  image: '/images/p2_olive.jpg'  },
        { name: 'Cream',  image: '/images/p2_cream.jpg'  },
        { name: 'Navy',   image: '/images/p2_navy.jpg'   },
        { name: 'Black',  image: '/images/p2_black.jpg'  },
      ],
      stock: 85,
      isActive: true,
    },

    // ── 3. Basic Round Neck Regular Tee ─────────────────────
    {
      name: 'Basic Round Neck T-Shirt',
      description:
        'A wardrobe essential. Lightweight 180 GSM fabric with a comfortable regular fit. Available in classic colours. Suitable for any occasion.',
      price: 399,
      category: id('Regular T-Shirts'),
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colours: [
        { name: 'White',  image: '/images/p3_white.jpg' },
        { name: 'Black',  image: '/images/p3_black.jpg' },
        { name: 'Navy',   image: '/images/p3_navy.jpg'  },
        { name: 'Red',    image: '/images/p3_red.jpg'   },
      ],
      stock: 200,
      isActive: true,
    },

    // ── 4. V-Neck Classic Tee ────────────────────────────────
    {
      name: 'V-Neck Classic T-Shirt',
      description:
        'A sleek V-neck tee with a slim regular fit. Soft and breathable cotton fabric. Great for layering or wearing on its own.',
      price: 449,
      category: id('Regular T-Shirts'),
      sizes: ['S', 'M', 'L', 'XL'],
      colours: [
        { name: 'White', image: '/images/p4_white.jpg' },
        { name: 'Grey',  image: '/images/p4_grey.jpg'  },
        { name: 'Black', image: '/images/p4_black.jpg' },
      ],
      stock: 90,
      isActive: true,
    },

    // ── 5. Abstract Graphic Tee ──────────────────────────────
    {
      name: 'Abstract Graphic T-Shirt',
      description:
        'Bold abstract artwork printed on premium quality cotton. Water-based eco-friendly ink. Limited run design that stands out in any crowd.',
      price: 599,
      category: id('Graphic T-Shirts'),
      sizes: ['S', 'M', 'L', 'XL'],
      colours: [
        { name: 'Black', image: '/images/p5_black.jpg' },
        { name: 'White', image: '/images/p5_white.jpg' },
      ],
      stock: 60,
      isActive: true,
    },

    // ── 6. Retro Logo Graphic Tee ────────────────────────────
    {
      name: 'Retro Logo Graphic T-Shirt',
      description:
        'Vintage-inspired retro graphic tee with distressed print effect. Soft-washed fabric for a pre-loved look and feel.',
      price: 649,
      category: id('Graphic T-Shirts'),
      sizes: ['M', 'L', 'XL', 'XXL'],
      colours: [
        { name: 'Washed Black', image: '/images/p6_washedblack.jpg' },
        { name: 'Sand',         image: '/images/p6_sand.jpg'  },
        { name: 'Burgundy',     image: '/images/p6_burgundy.jpg'  },
      ],
      stock: 45,
      isActive: true,
    },

    // ── 7. Name Print T-Shirt ────────────────────────────────
    {
      name: 'Custom Name Print T-Shirt',
      description:
        'Get your name or custom text printed on this high-quality tee. Durable screen print that lasts through multiple washes. Great personalised gift.',
      price: 499,
      category: id('Printed T-Shirts'),
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colours: [
        { name: 'Black',       image: '/images/p7_black.jpg' },
        { name: 'White',       image: '/images/p7_white.jpg' },
        { name: 'Royal Blue',  image: '/images/p7_royalblue.jpg'  },
        { name: 'Forest Green',image: '/images/p7_forestgreen.jpg' },
      ],
      stock: 150,
      isActive: true,
    },

    // ── 8. Sports Dry-Fit Tee ────────────────────────────────
    {
      name: 'Sports Dry-Fit T-Shirt',
      description:
        'Lightweight moisture-wicking fabric designed for active use. Quick dry technology keeps you cool during workouts. Regular athletic fit.',
      price: 499,
      category: id('Regular T-Shirts'),
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colours: [
        { name: 'Black',      image: '/images/p8_black.jpg' },
        { name: 'Royal Blue', image: '/images/p8_royalblue.jpg'  },
        { name: 'Red',        image: '/images/p8_red.jpg'   },
        { name: 'White',      image: '/images/p8_white.jpg' },
      ],
      stock: 100,
      isActive: true,
    },
  ];
}

// ── Main seed function ───────────────────────────────────────
async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Insert categories (skip existing ones)
    const insertedCats = [];
    for (const catData of CATEGORIES) {
      const existing = await Category.findOne({ name: catData.name });
      if (existing) {
        console.log(`  Category already exists: ${catData.name}`);
        insertedCats.push(existing);
      } else {
        const cat = await Category.create(catData);
        console.log(`  ✅ Category created: ${cat.name}`);
        insertedCats.push(cat);
      }
    }

    // Build product data now that we have real category _ids
    const products = buildProducts(insertedCats);

    // Insert products (update if same name already exists)
    let created = 0;
    let updated = 0;
    for (const productData of products) {
      const existing = await Product.findOne({ name: productData.name });
      if (existing) {
        console.log(`  Product already exists, updating: ${productData.name}`);
        await Product.updateOne({ name: productData.name }, productData);
        updated++;
      } else {
        await Product.create(productData);
        console.log(`  ✅ Product created: ${productData.name}`);
        created++;
      }
    }

    console.log('');
    console.log(`Seeding complete! Created: ${created} products, Updated: ${updated}`);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
}

seedProducts();
