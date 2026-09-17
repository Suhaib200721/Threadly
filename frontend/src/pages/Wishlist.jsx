import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const FALLBACK_IMAGE = 'https://placehold.co/500x600/eeeeee/999999.png?text=No+Image';

function Wishlist() {
  const { wishlist, loadingWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Track selected size for each card before adding to cart: { [productId]: 'M' }
  const [selectedSizes, setSelectedSizes] = useState({});
  const [feedbackMessages, setFeedbackMessages] = useState({});
  const [removingId, setRemovingId] = useState(null);

  const handleSizeSelect = (productId, size) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [productId]: size,
    }));
    // Clear error feedback if any
    setFeedbackMessages((prev) => ({
      ...prev,
      [productId]: null,
    }));
  };

  const handleAddToCart = (product) => {
    const size = selectedSizes[product._id];
    if (!size) {
      setFeedbackMessages((prev) => ({
        ...prev,
        [product._id]: { type: 'error', text: 'Please select a size first.' },
      }));
      return;
    }

    if (product.stock <= 0) {
      setFeedbackMessages((prev) => ({
        ...prev,
        [product._id]: { type: 'error', text: 'Sorry, this product is out of stock.' },
      }));
      return;
    }

    const defaultColour = product.colours?.[0] || { name: 'Standard', image: product.image };
    const res = addToCart(product, defaultColour, size, 1);

    if (res.success) {
      setFeedbackMessages((prev) => ({
        ...prev,
        [product._id]: {
          type: 'success',
          text: `Added size ${size} to cart!`,
        },
      }));
    } else {
      setFeedbackMessages((prev) => ({
        ...prev,
        [product._id]: { type: 'error', text: res.message },
      }));
    }
  };

  const handleRemove = async (productId) => {
    setRemovingId(productId);
    await removeFromWishlist(productId);
    setRemovingId(null);
  };

  if (loadingWishlist) {
    return (
      <div className="wishlist-page-container">
        <p className="page-loading">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="wishlist-page-container">
      {/* Header */}
      <div className="wishlist-header">
        <div>
          <h1>My Wishlist</h1>
          <p className="wishlist-header-subtitle">
            {wishlist.length > 0
              ? `You have saved ${wishlist.length} ${wishlist.length === 1 ? 'item' : 'items'} in your wishlist.`
              : 'Save products you love and purchase them anytime.'}
          </p>
        </div>

        {wishlist.length > 0 && (
          <Link to="/shop" className="btn btn-secondary btn-sm">
            Continue Shopping
          </Link>
        )}
      </div>

      {/* Empty State */}
      {wishlist.length === 0 ? (
        <div className="wishlist-empty-card">
          <h2>No products in your wishlist</h2>
          <p>You haven&apos;t saved any custom T-shirt designs yet. Explore our curated catalog and save your favorite styles!</p>
          <Link to="/shop" className="btn btn-primary" style={{ marginTop: '18px', display: 'inline-block' }}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        /* Wishlist Grid */
        <div className="wishlist-grid">
          {wishlist.map((item) => {
            const product = item.product;
            if (!product) return null;

            const selectedSize = selectedSizes[product._id] || '';
            const feedback = feedbackMessages[product._id];
            const displayImage = product.colours?.[0]?.image || product.image || FALLBACK_IMAGE;

            return (
              <div key={item._id || product._id} className="wishlist-card">
                {/* Remove from wishlist button */}
                <button
                  type="button"
                  className="wishlist-card-remove-btn"
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                  onClick={() => handleRemove(product._id)}
                  disabled={removingId === product._id}
                >
                  Remove
                </button>

                {/* Product Thumbnail */}
                <Link to={`/product/${product._id}`} className="wishlist-img-link">
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="wishlist-card-img"
                    onError={(e) => {
                      e.target.src = FALLBACK_IMAGE;
                    }}
                  />
                </Link>

                {/* Card Content */}
                <div className="wishlist-card-body">
                  {product.category && (
                    <span className="wishlist-category-tag">{product.category.name}</span>
                  )}

                  <h3 className="wishlist-product-title">
                    <Link to={`/product/${product._id}`}>{product.name}</Link>
                  </h3>

                  <div className="wishlist-price-row">
                    <span className="wishlist-price">₹{product.price.toLocaleString()}</span>
                    <span
                      className={`wishlist-stock-badge ${
                        product.stock <= 0 ? 'stock-out' : 'stock-in'
                      }`}
                    >
                      {product.stock <= 0 ? 'Out of Stock' : 'In Stock'}
                    </span>
                  </div>

                  {/* Size Selector for quick add to cart */}
                  {product.sizes && product.sizes.length > 0 && (
                    <div className="wishlist-size-picker">
                      <span className="picker-label">Select Size:</span>
                      <div className="wishlist-size-btns">
                        {product.sizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`size-pill ${selectedSize === s ? 'size-pill-active' : ''}`}
                            onClick={() => handleSizeSelect(product._id, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline feedback */}
                  {feedback && (
                    <div className={`wishlist-feedback-alert feedback-${feedback.type}`}>
                      <span>{feedback.text}</span>
                      {feedback.type === 'success' && (
                        <Link to="/cart" className="feedback-cart-link">
                          View Cart
                        </Link>
                      )}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="wishlist-card-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm btn-wishlist-cart"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>

                    <Link
                      to={`/product/${product._id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
