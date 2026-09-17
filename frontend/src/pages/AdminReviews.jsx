import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('All');

  const fetchAdminReviews = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/reviews');
      if (response.data.success) {
        setReviews(response.data.reviews || []);
        setAverageRating(response.data.averageRating || 0);
      } else {
        setError('Failed to load reviews.');
      }
    } catch (err) {
      console.error('Error fetching admin reviews:', err);
      setError(
        err.response?.data?.message || 'Could not load reviews. Please check admin authorization.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReviews();
  }, []);

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this customer review?')) {
      return;
    }

    setSuccessMessage('');
    setError('');
    try {
      const response = await api.delete(`/admin/reviews/${reviewId}`);
      if (response.data.success) {
        setSuccessMessage('Review has been successfully removed by administrator.');
        fetchAdminReviews();
      } else {
        setError('Could not delete review.');
      }
    } catch (err) {
      console.error('Delete review error:', err);
      setError(err.response?.data?.message || 'Server error deleting review.');
    }
  };

  const filteredReviews = useMemo(() => {
    return reviews.filter((rev) => {
      // 1. Rating filter
      if (selectedRating !== 'All' && rev.rating !== Number(selectedRating)) {
        return false;
      }

      // 2. Search term (Product name, Reviewer name, Title, Comment)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchProduct = (rev.product?.name || '').toLowerCase().includes(term);
        const matchReviewer = (rev.userName || '').toLowerCase().includes(term);
        const matchTitle = (rev.title || '').toLowerCase().includes(term);
        const matchComment = (rev.comment || '').toLowerCase().includes(term);

        return matchProduct || matchReviewer || matchTitle || matchComment;
      }

      return true;
    });
  }, [reviews, selectedRating, searchTerm]);

  const renderStars = (starCount) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= starCount ? 'star-gold' : 'star-gray'}>
          ★
        </span>
      );
    }
    return <span className="stars-row">{stars}</span>;
  };

  return (
    <div className="admin-orders-page">
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/admin">Admin</Link> &rsaquo; Customer Reviews
      </div>

      <div className="admin-orders-header">
        <div>
          <h1>Customer Reviews Moderation</h1>
          <p className="admin-orders-subtitle">
            Inspect all customer feedback across products and remove inappropriate reviews.
          </p>
        </div>
        <button
          className="btn-secondary btn-sm"
          onClick={fetchAdminReviews}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : '↻ Refresh Reviews'}
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="stat-label">Total Reviews</span>
          <strong className="stat-value">{reviews.length}</strong>
        </div>
        <div className="admin-stat-card stat-card-paid">
          <span className="stat-label">Average Rating</span>
          <strong className="stat-value">{averageRating > 0 ? averageRating : '5.0'} / 5</strong>
        </div>
        <div className="admin-stat-card stat-card-delivered">
          <span className="stat-label">5-Star Ratings</span>
          <strong className="stat-value">{reviews.filter((r) => r.rating === 5).length}</strong>
        </div>
        <div className="admin-stat-card stat-card-cancelled">
          <span className="stat-label">1 &amp; 2-Star Ratings</span>
          <strong className="stat-value">{reviews.filter((r) => r.rating <= 2).length}</strong>
        </div>
      </div>

      {successMessage && (
        <div className="status-updater-alert-success" style={{ marginBottom: '20px' }}>
          {successMessage}
        </div>
      )}

      {error && (
        <div className="admin-error-box" style={{ marginBottom: '20px' }}>
          <p>{error}</p>
        </div>
      )}

      {/* Filters Bar */}
      <div className="admin-filters-card">
        <div className="admin-search-box">
          <label htmlFor="reviewSearch">Search Reviews</label>
          <input
            type="text"
            id="reviewSearch"
            placeholder="Search by product name, reviewer, or review text..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="admin-status-filter-box">
          <label htmlFor="ratingFilter">Filter by Stars</label>
          <select
            id="ratingFilter"
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
          >
            <option value="All">All Ratings</option>
            <option value="5">5 Stars only</option>
            <option value="4">4 Stars only</option>
            <option value="3">3 Stars only</option>
            <option value="2">2 Stars only</option>
            <option value="1">1 Star only</option>
          </select>
        </div>

        {(searchTerm || selectedRating !== 'All') && (
          <button
            className="btn-secondary btn-sm btn-clear-filters"
            onClick={() => {
              setSearchTerm('');
              setSelectedRating('All');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="admin-loading-box">
          <p>Loading customer reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="admin-empty-box">
          <h2>No Reviews Found</h2>
          <p>Customer product reviews will appear here once submitted.</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="admin-empty-box">
          <h2>No Matching Reviews</h2>
          <p>No reviews match your filter query.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <div className="admin-table-count-label">
            Showing <strong>{filteredReviews.length}</strong> of <strong>{reviews.length}</strong> reviews
          </div>
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Headline</th>
                <th>Comments</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((rev) => {
                const formattedDate = new Date(rev.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={rev._id}>
                    <td>
                      {rev.product ? (
                        <Link
                          to={`/product/${rev.product._id}`}
                          className="admin-product-link"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <strong>{rev.product.name}</strong>
                        </Link>
                      ) : (
                        <span style={{ color: '#888' }}>Deleted Product</span>
                      )}
                    </td>
                    <td>
                      <div className="customer-cell">
                        <strong className="customer-cell-name">{rev.userName}</strong>
                        {rev.isVerifiedPurchase && (
                          <span className="verified-badge-mini">Verified Buyer</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ whiteSpace: 'nowrap' }}>
                        {renderStars(rev.rating)}
                      </div>
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.88rem' }}>{rev.title}</strong>
                    </td>
                    <td>
                      <p className="admin-review-comment-cell" title={rev.comment}>
                        {rev.comment}
                      </p>
                    </td>
                    <td className="order-date-cell">{formattedDate}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-text-danger btn-sm"
                        onClick={() => handleDeleteReview(rev._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminReviews;
