import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const FALLBACK_IMAGE = 'https://placehold.co/300x400/eeeeee/999999.png?text=No+Image';

function Cart() {
  const { cart, updateQuantity, removeFromCart, clearCart, totalItems, subtotal, totalPrice } = useCart();

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
  };

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="breadcrumb">
          <Link to="/">Home</Link> &rsaquo; <Link to="/shop">Shop</Link> &rsaquo; Cart
        </div>

        <div className="cart-empty-container">
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added any customized T-shirts to your cart yet.</p>
          <Link to="/shop" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Explore Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/shop">Shop</Link> &rsaquo; Cart
      </div>

      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <p className="cart-header-subtitle">
          You have {totalItems} item{totalItems === 1 ? '' : 's'} in your cart
        </p>
      </div>

      <div className="cart-layout">
        {/* ── LEFT COLUMN: Cart Items List ─────────────── */}
        <div className="cart-items-col">
          <div className="cart-items-list">
            {cart.map((item) => (
              <div key={item.id} className="cart-item-card">
                {/* Product Image */}
                <Link to={`/product/${item.productId}`} className="cart-item-img-link">
                  <img
                    src={item.image || FALLBACK_IMAGE}
                    alt={`${item.name} - ${item.colour}`}
                    className="cart-item-img"
                    onError={handleImageError}
                  />
                </Link>

                {/* Details */}
                <div className="cart-item-info">
                  <div className="cart-item-header">
                    <Link to={`/product/${item.productId}`} className="cart-item-name">
                      {item.name}
                    </Link>
                    <button
                      type="button"
                      className="cart-item-remove-btn"
                      onClick={() => removeFromCart(item.id)}
                      title="Remove item"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="cart-item-attributes">
                    <span className="cart-attr-badge">
                      Colour: <strong>{item.colour}</strong>
                    </span>
                    <span className="cart-attr-badge">
                      Size: <strong>{item.size}</strong>
                    </span>
                    {item.customName && (
                      <span className="cart-attr-badge">
                        Custom Name: <strong>{item.customName}</strong>
                      </span>
                    )}
                  </div>

                  <div className="cart-item-pricing-row">
                    <div className="cart-item-unit-price">
                      ₹{item.price.toLocaleString()} each
                    </div>

                    {/* Quantity Controls */}
                    <div className="cart-qty-control">
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        title="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="cart-qty-value">{item.quantity}</span>
                      <button
                        type="button"
                        className="cart-qty-btn"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.stock}
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="cart-item-subtotal">
                      ₹{(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>

                  {item.quantity >= item.stock && (
                    <p className="cart-stock-warning">
                      Maximum available stock reached ({item.stock})
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="cart-actions-row">
            <Link to="/shop" className="btn-secondary">
              Continue Shopping
            </Link>
            <button type="button" className="btn-text-danger" onClick={clearCart}>
              Clear Entire Cart
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Order Summary ─────────────── */}
        <div className="cart-summary-col">
          <div className="cart-summary-card">
            <h2>Order Summary</h2>

            <div className="cart-summary-row">
              <span>Items Total ({totalItems})</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            <div className="cart-summary-row">
              <span>Standard Delivery</span>
              <span className="cart-free-tag">FREE</span>
            </div>

            <hr className="cart-summary-divider" />

            <div className="cart-summary-row cart-total-row">
              <span>Total Amount</span>
              <span className="cart-total-price">₹{totalPrice.toLocaleString()}</span>
            </div>

            <Link
              to="/checkout"
              className="btn-primary btn-block cart-checkout-btn"
              style={{ textAlign: 'center' }}
            >
              Proceed to Checkout
            </Link>

            <div className="cart-summary-perks">
              <p>100% Cotton & Premium Fabrics</p>
              <p>Free Standard Shipping across India</p>
              <p>7-Day Hassle-Free Returns</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
