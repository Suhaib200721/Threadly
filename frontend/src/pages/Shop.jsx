import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

// Fallback image shown if the product image fails to load
const FALLBACK_IMAGE = 'https://placehold.co/300x380/eeeeee/999999.png?text=No+Image';

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/products')
      .then((res) => {
        setProducts(res.data.products);
      })
      .catch(() => {
        setError('Could not load products. Please try again later.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="page-loading">Loading products...</p>;
  }

  if (error) {
    return <p className="page-error">{error}</p>;
  }

  return (
    <div className="shop-page">
      <div className="shop-header">
        <h1>Shop T-Shirts</h1>
        <p>{products.length} products available</p>
      </div>

      {products.length === 0 ? (
        <p className="page-loading">No products found.</p>
      ) : (
        <div className="shop-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────
function ProductCard({ product }) {
  // Show the first colour's image by default
  const [selectedColour, setSelectedColour] = useState(product.colours && product.colours.length > 0 ? product.colours[0] : null);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
  };

  const stockLabel =
    product.stock === 0
      ? 'Out of Stock'
      : product.stock <= 10
      ? `Only ${product.stock} left`
      : 'In Stock';

  const stockClass =
    product.stock === 0 ? 'badge-out' : product.stock <= 10 ? 'badge-low' : 'badge-in';

  return (
    <div className="product-card-shop">
      {/* Product Image — changes when colour is selected */}
      <Link to={`/product/${product._id}`}>
        <div className="product-card-img-wrap">
          <img
            src={selectedColour ? selectedColour.image : FALLBACK_IMAGE}
            alt={`${product.name} - ${selectedColour ? selectedColour.name : 'Unknown'}`}
            className="product-card-img"
            onError={handleImageError}
          />
        </div>
      </Link>

      <div className="product-card-body">
        {/* Category */}
        {product.category && (
          <span className="product-category-tag">{product.category.name}</span>
        )}

        {/* Name */}
        <Link to={`/product/${product._id}`}>
          <h3 className="product-card-name">{product.name}</h3>
        </Link>

        {/* Price */}
        <p className="product-card-price">₹{product.price.toLocaleString()}</p>

        {/* Stock badge */}
        <span className={`stock-badge ${stockClass}`}>{stockLabel}</span>

        {/* Colour dots — clicking changes the preview image */}
        <div className="colour-dots">
          {product.colours.map((colour) => (
            <button
              key={colour.name}
              className={`colour-dot-btn ${selectedColour.name === colour.name ? 'active' : ''}`}
              onClick={() => setSelectedColour(colour)}
              title={colour.name}
            />
          ))}
        </div>
        <p className="selected-colour-label">{selectedColour.name}</p>

        {/* Sizes preview */}
        <div className="size-pills">
          {product.sizes.map((size) => (
            <span key={size} className="size-pill">{size}</span>
          ))}
        </div>

        {/* View button */}
        <Link to={`/product/${product._id}`} className="btn-primary btn-block">
          View Product
        </Link>
      </div>
    </div>
  );
}

export default Shop;
