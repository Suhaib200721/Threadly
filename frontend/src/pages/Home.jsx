import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const FALLBACK_IMAGE = 'https://placehold.co/300x380/eeeeee/999999.png?text=No+Image';

function Home() {
  const [backendStatus, setBackendStatus] = useState('Checking...');
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  useEffect(() => {
    // Check backend connection
    api.get('/test')
      .then(() => {
        setBackendStatus('Connected');
      })
      .catch(() => {
        setBackendStatus('Offline');
      });

    // Fetch real featured products
    api.get('/products')
      .then((res) => {
        if (res.data && res.data.products) {
          // Take first 4 products
          setFeaturedProducts(res.data.products.slice(0, 4));
        }
      })
      .catch((err) => {
        console.error('Failed to load featured products:', err);
      })
      .finally(() => {
        setLoadingFeatured(false);
      });
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Wear Your Story</h1>
          <p>Custom T-shirts designed by you, made for you.</p>
          <div className="hero-actions">
            <Link to="/shop" className="btn-primary">
              Explore Collection
            </Link>
          </div>
        </div>
      </section>

      {/* Short Introduction */}
      <section className="intro">
        <h2>Welcome to THREADLY</h2>
        <p>
          Premium quality fabrics, modern fits, and vibrant color variants.
          Choose your style, select your favorite colour, and get it delivered directly to your doorstep.
        </p>
      </section>

      {/* Featured Section */}
      <section className="featured">
        <h2>Featured Collection</h2>
        <p className="featured-subtitle">Discover our most popular customized T-shirt fits</p>

        {loadingFeatured ? (
          <p className="page-loading">Loading collection...</p>
        ) : featuredProducts.length > 0 ? (
          <div className="featured-grid">
            {featuredProducts.map((product) => {
              const displayImage =
                product.colours?.[0]?.image || product.image || FALLBACK_IMAGE;

              return (
                <div key={product._id} className="home-product-card">
                  <Link to={`/product/${product._id}`} className="home-product-img-wrap">
                    <img
                      src={displayImage}
                      alt={product.name}
                      className="home-product-img"
                      onError={(e) => {
                        e.target.src = FALLBACK_IMAGE;
                      }}
                    />
                  </Link>
                  <div className="home-product-body">
                    {product.category && (
                      <span className="product-category-tag">{product.category.name}</span>
                    )}
                    <h3 className="home-product-title">
                      <Link to={`/product/${product._id}`}>{product.name}</Link>
                    </h3>
                    <p className="home-product-price">₹{product.price.toLocaleString()}</p>
                    <Link to={`/product/${product._id}`} className="btn-primary btn-sm btn-block">
                      View Details
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="featured-empty">
            <Link to="/shop" className="btn-primary">
              View All Products
            </Link>
          </div>
        )}
      </section>

      {/* Feature Highlights Grid */}
      <section className="home-features-grid">
        <div className="feature-box">
          <h3>100% Combed Cotton</h3>
          <p>Breathable, durable, and ultra-soft fabric engineered for daily wear.</p>
        </div>
        <div className="feature-box">
          <h3>Curated Colorways</h3>
          <p>Over 26 tailored color variants across classic and oversized fits.</p>
        </div>
        <div className="feature-box">
          <h3>Fast Delivery</h3>
          <p>Doorstep delivery with real-time order tracking from warehouse to door.</p>
        </div>
      </section>

      {/* Backend Status Note */}
      <section className="api-status">
        <p>
          THREADLY API: <span className="api-status-badge">{backendStatus}</span>
        </p>
      </section>
    </div>
  );
}

export default Home;
