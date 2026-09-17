import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

const FALLBACK_IMAGE = 'https://placehold.co/500x600/eeeeee/999999.png?text=No+Image';

function ProductDetails() {
  const { id } = useParams(); // get the product ID from the URL
  const { addToCart } = useCart();
  const { isLoggedIn, user } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected colour and size — local state only, no page reload needed
  const [selectedColour, setSelectedColour] = useState(null);
  const [selectedSize, setSelectedSize] = useState('');
  const [customName, setCustomName] = useState('');
  const [cleanedImageSrc, setCleanedImageSrc] = useState(null);
  const [cartFeedback, setCartFeedback] = useState(null);
  const cleanedImageCache = useRef({});

  // ── WISHLIST STATE (PHASE 11) ────────────────────────────────
  const [wishlistFeedback, setWishlistFeedback] = useState(null);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // ── REVIEWS STATE (PHASE 9) ──────────────────────────────────
  const [reviewsData, setReviewsData] = useState({
    totalReviews: 0,
    averageRating: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
    userReview: null,
    hasPurchased: false,
  });
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Review Form state
  const [rating, setRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFormError, setReviewFormError] = useState('');
  const [reviewFormSuccess, setReviewFormSuccess] = useState('');
  const [isEditingReview, setIsEditingReview] = useState(false);

  const fetchProduct = () => {
    setLoading(true);
    api.get(`/products/${id}`)
      .then((res) => {
        const p = res.data.product;
        setProduct(p);
        if (p.colours && p.colours.length > 0) {
          setSelectedColour(p.colours[0]);
        }
      })
      .catch(() => {
        setError('Product not found or could not be loaded.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const fetchReviews = () => {
    setReviewsLoading(true);
    api.get(`/reviews/product/${id}`)
      .then((res) => {
        if (res.data.success) {
          setReviewsData(res.data);
          if (res.data.userReview) {
            setRating(res.data.userReview.rating);
            setReviewTitle(res.data.userReview.title);
            setReviewComment(res.data.userReview.comment);
          } else {
            setRating(5);
            setReviewTitle('');
            setReviewComment('');
          }
        }
      })
      .catch((err) => {
        console.error('Error loading reviews:', err);
      })
      .finally(() => {
        setReviewsLoading(false);
      });
  };

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id, isLoggedIn]);

  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = FALLBACK_IMAGE;
  };

  const getColorHex = (name) => {
    const l = name.toLowerCase();
    if (l.includes('black')) return '#1a1a1a';
    if (l.includes('white')) return '#f5f5f5';
    if (l.includes('grey')) return '#888888';
    if (l.includes('olive') || l.includes('green')) return '#556b2f';
    if (l.includes('cream') || l.includes('sand')) return '#fffdd0';
    if (l.includes('navy')) return '#1a2a4a';
    if (l.includes('red')) return '#cc3333';
    if (l.includes('burg') || l.includes('maroon')) return '#722f37';
    if (l.includes('blue')) return '#2255aa';
    return '#f5f5f5';
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    if (cartFeedback?.type === 'error') {
      setCartFeedback(null);
    }
  };

  const isCustomNameProduct = Boolean(
    product?.name && product.name.toLowerCase().includes('custom name print')
  );

  const getShirtOverlayStyles = (colourName) => {
    const l = (colourName || '').toLowerCase();
    if (l.includes('white')) {
      return {
        textColor: '#111111',
      };
    }
    // Default / Black / Royal Blue / Forest Green
    return {
      textColor: '#ffffff',
    };
  };

  // Helper to remove static "YOUR NAME" text on Custom Name Print T-shirt
  // by inpainting with the natural chest fabric directly below the text.
  // Uses fetch -> blob -> createObjectURL so canvas is 100% same-origin with zero CORS errors.
  const cleanShirtImage = async (imageSrc) => {
    if (!imageSrc) return imageSrc;
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              URL.revokeObjectURL(blobUrl);
              resolve(imageSrc);
              return;
            }

            ctx.drawImage(img, 0, 0);

            // Coordinates normalized to 848x1264 base coordinate space
            const scaleX = canvas.width / 848;
            const scaleY = canvas.height / 1264;

            const x1 = Math.round(350 * scaleX);
            const x2 = Math.round(516 * scaleX);
            const y1 = Math.round(386 * scaleY);
            const y2 = Math.round(425 * scaleY);

            const w = x2 - x1 + 1;
            const h = y2 - y1 + 1;

            // Source clean fabric directly below the text
            const srcY1 = y2 + 3;
            const srcY2 = srcY1 + h - 1;

            const minX = Math.max(0, x1 - 5);
            const maxX = Math.min(canvas.width - 1, x2 + 5);
            const minY = Math.max(0, y1 - 5);
            const maxY = Math.min(canvas.height - 1, srcY2 + 5);

            const rw = maxX - minX + 1;
            const rh = maxY - minY + 1;

            const imgData = ctx.getImageData(minX, minY, rw, rh);
            const data = imgData.data;

            const getIdx = (x, y) => ((y - minY) * rw + (x - minX)) * 4;

            // Copy fabric patch with smooth vertical brightness gradient
            for (let c = 0; c < w; c++) {
              const curX = x1 + c;
              const topTargetIdx = getIdx(curX, y1 - 1);
              const botTargetIdx = getIdx(curX, y2 + 1);
              const sampleTopIdx = getIdx(curX, srcY1);
              const sampleBotIdx = getIdx(curX, srcY2);

              const diffTopR = data[topTargetIdx] - data[sampleTopIdx];
              const diffTopG = data[topTargetIdx + 1] - data[sampleTopIdx + 1];
              const diffTopB = data[topTargetIdx + 2] - data[sampleTopIdx + 2];

              const diffBotR = data[botTargetIdx] - data[sampleBotIdx];
              const diffBotG = data[botTargetIdx + 1] - data[sampleBotIdx + 1];
              const diffBotB = data[botTargetIdx + 2] - data[sampleBotIdx + 2];

              for (let r = 0; r < h; r++) {
                const curY = y1 + r;
                const targetIdx = getIdx(curX, curY);
                const sampleIdx = getIdx(curX, srcY1 + r);

                const t = r / (h - 1);
                const offR = (1 - t) * diffTopR + t * diffBotR;
                const offG = (1 - t) * diffTopG + t * diffBotG;
                const offB = (1 - t) * diffTopB + t * diffBotB;

                data[targetIdx] = Math.min(255, Math.max(0, data[sampleIdx] + offR));
                data[targetIdx + 1] = Math.min(255, Math.max(0, data[sampleIdx + 1] + offG));
                data[targetIdx + 2] = Math.min(255, Math.max(0, data[sampleIdx + 2] + offB));
                data[targetIdx + 3] = 255;
              }
            }

            // Smooth boundary transitions to guarantee zero edge lines
            for (let c = 0; c < w; c++) {
              const curX = x1 + c;
              const topTargetIdx = getIdx(curX, y1 - 1);
              const botTargetIdx = getIdx(curX, y2 + 1);

              for (let r = 0; r < 4; r++) {
                const alpha = (r + 1) / 5.0;
                const targetIdx = getIdx(curX, y1 + r);
                data[targetIdx] = Math.round((1 - alpha) * data[topTargetIdx] + alpha * data[targetIdx]);
                data[targetIdx + 1] = Math.round((1 - alpha) * data[topTargetIdx + 1] + alpha * data[targetIdx + 1]);
                data[targetIdx + 2] = Math.round((1 - alpha) * data[topTargetIdx + 2] + alpha * data[targetIdx + 2]);
              }

              for (let r = 0; r < 4; r++) {
                const alpha = (r + 1) / 5.0;
                const targetIdx = getIdx(curX, y2 - r);
                data[targetIdx] = Math.round((1 - alpha) * data[botTargetIdx] + alpha * data[targetIdx]);
                data[targetIdx + 1] = Math.round((1 - alpha) * data[botTargetIdx + 1] + alpha * data[targetIdx + 1]);
                data[targetIdx + 2] = Math.round((1 - alpha) * data[botTargetIdx + 2] + alpha * data[targetIdx + 2]);
              }
            }

            for (let r = 0; r < h; r++) {
              const curY = y1 + r;
              const leftTargetIdx = getIdx(x1 - 1, curY);
              const rightTargetIdx = getIdx(x2 + 1, curY);

              for (let c = 0; c < 5; c++) {
                const alpha = (c + 1) / 6.0;
                const targetIdx = getIdx(x1 + c, curY);
                data[targetIdx] = Math.round((1 - alpha) * data[leftTargetIdx] + alpha * data[targetIdx]);
                data[targetIdx + 1] = Math.round((1 - alpha) * data[leftTargetIdx + 1] + alpha * data[targetIdx + 1]);
                data[targetIdx + 2] = Math.round((1 - alpha) * data[leftTargetIdx + 2] + alpha * data[targetIdx + 2]);
              }

              for (let c = 0; c < 5; c++) {
                const alpha = (c + 1) / 6.0;
                const targetIdx = getIdx(x2 - c, curY);
                data[targetIdx] = Math.round((1 - alpha) * data[rightTargetIdx] + alpha * data[targetIdx]);
                data[targetIdx + 1] = Math.round((1 - alpha) * data[rightTargetIdx + 1] + alpha * data[targetIdx + 1]);
                data[targetIdx + 2] = Math.round((1 - alpha) * data[rightTargetIdx + 2] + alpha * data[targetIdx + 2]);
              }
            }

            ctx.putImageData(imgData, minX, minY);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
            URL.revokeObjectURL(blobUrl);
            resolve(dataUrl);
          } catch (err) {
            console.error('Canvas processing error:', err);
            URL.revokeObjectURL(blobUrl);
            resolve(imageSrc);
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(blobUrl);
          resolve(imageSrc);
        };
        img.src = blobUrl;
      });
    } catch (err) {
      console.error('Fetch error:', err);
      return imageSrc;
    }
  };

  // Client-side canvas preprocessing: clean the static "YOUR NAME" text on load
  // and cache all variants for instantaneous, flicker-free switching.
  useEffect(() => {
    if (!isCustomNameProduct || !selectedColour?.image) {
      setCleanedImageSrc(null);
      return;
    }

    const currentColourName = selectedColour.name;
    const currentImgSrc = selectedColour.image;

    if (cleanedImageCache.current[currentColourName]) {
      setCleanedImageSrc(cleanedImageCache.current[currentColourName]);
    } else {
      let isMounted = true;
      cleanShirtImage(currentImgSrc).then((cleanedUrl) => {
        cleanedImageCache.current[currentColourName] = cleanedUrl;
        if (isMounted) {
          setCleanedImageSrc(cleanedUrl);
        }
      });
      return () => {
        isMounted = false;
      };
    }

    // Pre-clean other colours in background
    if (product?.colours) {
      product.colours.forEach((c) => {
        if (c.image && !cleanedImageCache.current[c.name]) {
          cleanShirtImage(c.image).then((url) => {
            cleanedImageCache.current[c.name] = url;
          });
        }
      });
    }
  }, [isCustomNameProduct, selectedColour?.name, selectedColour?.image, product?.colours]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setCartFeedback({
        type: 'error',
        message: 'Please select a size before adding to cart.',
      });
      return;
    }

    if (product.stock <= 0) {
      setCartFeedback({
        type: 'error',
        message: 'Sorry, this product is currently out of stock.',
      });
      return;
    }

    const currentColour = selectedColour || (product.colours && product.colours[0]);
    const nameToSave = isCustomNameProduct ? customName.trim() : '';
    const result = addToCart(product, currentColour, selectedSize, 1, nameToSave);

    if (result.success) {
      setCartFeedback({
        type: 'success',
        message: result.message || 'Added to cart successfully!',
      });
    } else {
      setCartFeedback({
        type: 'error',
        message: result.message || 'Could not add to cart.',
      });
    }
  };

  // ── WISHLIST HANDLER (PHASE 11) ──────────────────────────────
  const handleWishlistToggle = async () => {
    if (!isLoggedIn) {
      setWishlistFeedback({
        type: 'info',
        message: 'Please login to save products.',
      });
      return;
    }

    setTogglingWishlist(true);
    setWishlistFeedback(null);
    const res = await toggleWishlist(id);
    if (res.success) {
      setWishlistFeedback({
        type: 'success',
        message: res.message,
      });
    } else {
      setWishlistFeedback({
        type: 'error',
        message: res.message,
      });
    }
    setTogglingWishlist(false);
  };

  // ── REVIEWS HANDLERS ─────────────────────────────────────────
  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!rating || rating < 1 || rating > 5) {
      setReviewFormError('Please select a star rating between 1 and 5.');
      return;
    }

    if (!reviewTitle.trim()) {
      setReviewFormError('Please enter a review headline / title.');
      return;
    }

    if (!reviewComment.trim()) {
      setReviewFormError('Please enter your review comments.');
      return;
    }

    setSubmittingReview(true);
    setReviewFormError('');
    setReviewFormSuccess('');

    try {
      if (isEditingReview && reviewsData.userReview) {
        // Update existing review
        const res = await api.put(`/reviews/${reviewsData.userReview._id}`, {
          rating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        });
        if (res.data.success) {
          setReviewFormSuccess('Your review has been updated!');
          setIsEditingReview(false);
          fetchReviews();
        }
      } else {
        // Create new review
        const res = await api.post('/reviews', {
          productId: id,
          rating,
          title: reviewTitle.trim(),
          comment: reviewComment.trim(),
        });
        if (res.data.success) {
          setReviewFormSuccess('Thank you! Your review has been submitted.');
          fetchReviews();
        }
      }
    } catch (err) {
      console.error('Review submit error:', err);
      setReviewFormError(
        err.response?.data?.message || 'Could not submit review. Please try again.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewsData.userReview) return;

    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }

    try {
      const res = await api.delete(`/reviews/${reviewsData.userReview._id}`);
      if (res.data.success) {
        setReviewTitle('');
        setReviewComment('');
        setRating(5);
        setIsEditingReview(false);
        setReviewFormSuccess('Your review has been deleted.');
        fetchReviews();
      }
    } catch (err) {
      console.error('Delete review error:', err);
      setReviewFormError(err.response?.data?.message || 'Could not delete review.');
    }
  };

  const renderStars = (starCount) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= starCount ? 'star-gold' : 'star-gray'}
        >
          ★
        </span>
      );
    }
    return <span className="stars-row">{stars}</span>;
  };

  if (loading) return <p className="page-loading">Loading product...</p>;
  if (error)   return <p className="page-error">{error}</p>;
  if (!product) return null;

  const stockLabel =
    product.stock === 0
      ? 'Out of Stock'
      : product.stock <= 10
      ? `Only ${product.stock} left!`
      : 'In Stock';

  const stockClass =
    product.stock === 0 ? 'badge-out' : product.stock <= 10 ? 'badge-low' : 'badge-in';

  return (
    <div className="product-detail-page">

      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/shop">Shop</Link> &rsaquo; {product.name}
      </div>

      <div className="product-detail-layout">

        {/* ── LEFT: Product Image & Vertical Colour Selector ─── */}
        <div className="product-detail-img-col">
          
          <div className="vertical-colour-selector">
            <div className="vertical-line"></div>
            {product.colours.map((colour) => (
              <div 
                key={colour.name} 
                className={`colour-indicator-wrapper ${selectedColour?.name === colour.name ? 'active' : ''}`}
                onClick={() => {
                  setSelectedColour(colour);
                  if (cartFeedback?.type === 'error') setCartFeedback(null);
                }}
                title={colour.name}
              >
                <div 
                  className="colour-indicator-circle"
                  style={{ backgroundColor: getColorHex(colour.name) }}
                ></div>
              </div>
            ))}
          </div>

          <div className="product-detail-img-container">
            <img
              src={
                isCustomNameProduct && (cleanedImageCache.current[selectedColour?.name] || cleanedImageSrc)
                  ? (cleanedImageCache.current[selectedColour?.name] || cleanedImageSrc)
                  : (selectedColour ? selectedColour.image : FALLBACK_IMAGE)
              }
              alt={`${product.name} - ${selectedColour?.name}`}
              className="product-detail-img"
              onError={handleImageError}
            />
            {isCustomNameProduct && customName.trim() && (
              <div
                className="shirt-custom-name-overlay"
                style={{
                  background: 'transparent',
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                  outline: 'none',
                }}
              >
                <span
                  className="shirt-custom-name-text"
                  style={{
                    color: getShirtOverlayStyles(selectedColour?.name).textColor,
                    background: 'transparent',
                    backgroundColor: 'transparent',
                    border: 'none',
                    boxShadow: 'none',
                    outline: 'none',
                  }}
                >
                  {customName.trim().toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Product Info ─────────────────────────── */}
        <div className="product-detail-info-col">

          {/* Category */}
          {product.category && (
            <span className="product-category-tag">{product.category.name}</span>
          )}

          {/* Name — does NOT change when colour is selected */}
          <h1 className="product-detail-name">{product.name}</h1>

          {/* Rating Summary Link Header */}
          <div className="product-rating-header-row">
            {renderStars(Math.round(reviewsData.averageRating || 5))}
            <span className="rating-score-text">
              {reviewsData.averageRating > 0 ? reviewsData.averageRating : '5.0'} / 5
            </span>
            <span className="rating-count-text">
              ({reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'review' : 'reviews'})
            </span>
          </div>

          {/* Price — does NOT change when colour is selected */}
          <p className="product-detail-price">₹{product.price.toLocaleString()}</p>

          {/* Stock */}
          <span className={`stock-badge ${stockClass}`}>{stockLabel}</span>

          {/* Description — does NOT change */}
          <p className="product-detail-desc">{product.description}</p>

          {/* ── Size Selector ────────────────────────────── */}
          <div className="selector-section">
            <p className="selector-label">
              Size: {selectedSize ? <strong>{selectedSize}</strong> : <span className="selector-hint">(Select a size)</span>}
            </p>
            <div className="size-selector">
              {product.sizes.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`size-btn ${selectedSize === size ? 'size-btn-active' : ''}`}
                  onClick={() => handleSizeSelect(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* ── Custom Name Section (Only for Custom Name Print T-Shirt) ── */}
          {isCustomNameProduct && (
            <div className="selector-section custom-name-section">
              <label htmlFor="custom-name-input" className="selector-label">
                Custom Name:
              </label>
              <input
                type="text"
                id="custom-name-input"
                className="custom-name-input"
                placeholder="Enter your name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                maxLength={20}
              />
            </div>
          )}

          {/* ── Add to Cart Button ────────────────────────── */}
          <button
            type="button"
            className="btn-primary btn-block btn-add-to-cart"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>

          {/* ── Wishlist Toggle Button (PHASE 11) ─────────── */}
          <button
            type="button"
            className={`btn-wishlist-toggle ${
              isInWishlist(product._id) ? 'btn-wishlist-saved' : ''
            }`}
            onClick={handleWishlistToggle}
            disabled={togglingWishlist}
          >
            <span>
              {isInWishlist(product._id) ? 'Saved in Wishlist' : 'Add to Wishlist'}
            </span>
          </button>

          {/* ── Wishlist Feedback Message ─────────────────── */}
          {wishlistFeedback && (
            <div
              className={`wishlist-alert wishlist-alert-${wishlistFeedback.type}`}
            >
              <span>{wishlistFeedback.message}</span>
              {!isLoggedIn && (
                <Link to="/login" className="wishlist-alert-link">
                  Login
                </Link>
              )}
            </div>
          )}

          {/* ── Cart Feedback Message ─────────────────────── */}
          {cartFeedback && (
            <div className={`cart-alert cart-alert-${cartFeedback.type}`}>
              <span>{cartFeedback.message}</span>
              {cartFeedback.type === 'success' && (
                <Link to="/cart" className="cart-alert-link">
                  View Cart
                </Link>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── PHASE 9: REVIEWS & RATINGS SECTION ──────────────── */}
      <section className="product-reviews-section">
        <div className="reviews-section-header">
          <h2>Customer Reviews &amp; Ratings</h2>
          <p className="reviews-subtitle">
            Verified ratings and feedback from custom T-shirt buyers.
          </p>
        </div>

        <div className="reviews-layout-grid">
          {/* ── Left Column: Rating Summary Box ─────────────── */}
          <div className="rating-summary-card">
            <h3>Rating Overview</h3>
            <div className="rating-big-score">
              <strong className="score-num">
                {reviewsData.averageRating > 0 ? reviewsData.averageRating : '5.0'}
              </strong>
              <div className="score-stars">
                {renderStars(Math.round(reviewsData.averageRating || 5))}
                <span className="score-sub">
                  Based on {reviewsData.totalReviews} {reviewsData.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            </div>

            {/* Star Distribution Breakdown */}
            <div className="star-breakdown-list">
              {[5, 4, 3, 2, 1].map((s) => {
                const count = reviewsData.ratingCounts[s] || 0;
                const percent =
                  reviewsData.totalReviews > 0
                    ? Math.round((count / reviewsData.totalReviews) * 100)
                    : 0;

                return (
                  <div key={s} className="breakdown-row">
                    <span className="breakdown-star-label">{s} ★</span>
                    <div className="breakdown-bar-track">
                      <div
                        className="breakdown-bar-fill"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="breakdown-count-label">{count}</span>
                  </div>
                );
              })}
            </div>

            {reviewsData.hasPurchased && (
              <div className="verified-buyer-status-banner">
                <span>Verified Buyer: You have purchased this item</span>
              </div>
            )}
          </div>

          {/* ── Right Column: Write / Edit Review Form ──────── */}
          <div className="write-review-card">
            {!isLoggedIn ? (
              <div className="login-to-review-box">
                <h4>Have you tried this T-shirt?</h4>
                <p>Please log in to share your rating and review with other shoppers.</p>
                <Link to="/login" className="btn-primary btn-sm" style={{ marginTop: '12px', display: 'inline-block' }}>
                  Log In to Write a Review
                </Link>
              </div>
            ) : reviewsData.userReview && !isEditingReview ? (
              <div className="user-existing-review-box">
                <div className="existing-review-header">
                  <div>
                    <span className="existing-review-badge">Your Submitted Review</span>
                    <h4>{reviewsData.userReview.title}</h4>
                    <div style={{ margin: '4px 0' }}>
                      {renderStars(reviewsData.userReview.rating)}
                    </div>
                  </div>
                  <div className="existing-review-actions">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => setIsEditingReview(true)}
                    >
                      Edit Review
                    </button>
                    <button
                      type="button"
                      className="btn-text-danger btn-sm"
                      onClick={handleDeleteReview}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="existing-review-comment">{reviewsData.userReview.comment}</p>
                {reviewFormSuccess && (
                  <div className="review-alert-success" style={{ marginTop: '12px' }}>
                    {reviewFormSuccess}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="review-form">
                <h3>{isEditingReview ? 'Edit Your Review' : 'Write a Customer Review'}</h3>

                {reviewFormSuccess && (
                  <div className="review-alert-success">{reviewFormSuccess}</div>
                )}
                {reviewFormError && (
                  <div className="review-alert-error">{reviewFormError}</div>
                )}

                {/* Rating selection */}
                <div className="form-group">
                  <label>Overall Rating *</label>
                  <div className="rating-selector-buttons">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`rating-pick-btn ${rating >= s ? 'pick-active' : ''}`}
                        onClick={() => setRating(s)}
                        title={`${s} Star${s > 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                    <span className="rating-pick-label">
                      {rating} Star{rating > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Title */}
                <div className="form-group">
                  <label htmlFor="reviewTitle">Headline / Title *</label>
                  <input
                    type="text"
                    id="reviewTitle"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="e.g. Great quality cotton & fits perfectly!"
                    maxLength={100}
                    disabled={submittingReview}
                  />
                </div>

                {/* Comments */}
                <div className="form-group">
                  <label htmlFor="reviewComment">Detailed Review *</label>
                  <textarea
                    id="reviewComment"
                    rows={4}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us what you liked about the fabric, sizing, comfort, and print quality..."
                    maxLength={1000}
                    disabled={submittingReview}
                  />
                </div>

                <div className="review-form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={submittingReview}
                  >
                    {submittingReview
                      ? 'Submitting...'
                      : isEditingReview
                      ? 'Save Changes'
                      : 'Submit Review'}
                  </button>

                  {isEditingReview && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setIsEditingReview(false);
                        setReviewFormError('');
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── Customer Reviews List ─────────────────────────── */}
        <div className="reviews-list-container">
          <h3>Customer Reviews ({reviewsData.totalReviews})</h3>

          {reviewsLoading ? (
            <p className="reviews-loading">Loading customer reviews...</p>
          ) : reviewsData.reviews.length === 0 ? (
            <div className="no-reviews-box">
              <p>No customer reviews yet. Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="reviews-cards-list">
              {reviewsData.reviews.map((rev) => {
                const revDate = new Date(rev.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div key={rev._id} className="review-item-card">
                    <div className="review-item-header">
                      <div className="reviewer-info">
                        <strong className="reviewer-name">{rev.userName}</strong>
                        {rev.isVerifiedPurchase && (
                          <span className="verified-purchase-tag">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <span className="review-date">{revDate}</span>
                    </div>

                    <div className="review-item-rating">
                      {renderStars(rev.rating)}
                      <strong className="review-item-title">{rev.title}</strong>
                    </div>

                    <p className="review-item-comment">{rev.comment}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default ProductDetails;
