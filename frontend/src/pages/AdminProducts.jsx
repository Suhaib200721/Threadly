import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api, { getImageUrl, handleImageErrorWithFallback, FALLBACK_IMAGE } from '../services/api';
import AdminLayout from '../components/AdminLayout';

// ─── Blank form state ─────────────────────────────────────────
const BLANK_PRODUCT = {
  name: '',
  description: '',
  price: '',
  stock: '',
  category: '',
  sizes: [],
  colours: [{ name: '', image: '' }],
  isActive: true,
};

const ALL_SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & View Mode state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Product form state
  const [productForm, setProductForm] = useState(BLANK_PRODUCT);
  const [editingProductId, setEditingProductId] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [productError, setProductError] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [productLoading, setProductLoading] = useState(false);

  // Category form state
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [editingCatId, setEditingCatId] = useState(null);
  const [showCatPanel, setShowCatPanel] = useState(false);
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  // Fetch products and categories on mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = () => {
    setLoading(true);
    api.get('/products/admin/all')
      .then((res) => setProducts(res.data.products || []))
      .catch(() => setProductError('Could not load products.'))
      .finally(() => setLoading(false));
  };

  const loadCategories = () => {
    api.get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch(() => {});
  };

  // ── Product form handlers ────────────────────────────────────
  const handleProductField = (field, value) => {
    setProductForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSize = (size) => {
    setProductForm((prev) => {
      const has = prev.sizes.includes(size);
      return {
        ...prev,
        sizes: has ? prev.sizes.filter((s) => s !== size) : [...prev.sizes, size],
      };
    });
  };

  const handleColourChange = (index, field, value) => {
    setProductForm((prev) => {
      const newColours = [...prev.colours];
      newColours[index] = { ...newColours[index], [field]: value };
      return { ...prev, colours: newColours };
    });
  };

  const addColour = () => {
    setProductForm((prev) => ({
      ...prev,
      colours: [...prev.colours, { name: '', image: '' }],
    }));
  };

  const removeColour = (index) => {
    setProductForm((prev) => ({
      ...prev,
      colours: prev.colours.filter((_, i) => i !== index),
    }));
  };

  const startEditProduct = (product) => {
    setEditingProductId(product._id);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      category: product.category?._id || product.category || '',
      sizes: product.sizes || [],
      colours: product.colours && product.colours.length > 0 ? product.colours : [{ name: '', image: '' }],
      isActive: product.isActive !== undefined ? product.isActive : true,
    });
    setShowProductForm(true);
    setProductError('');
    setProductSuccess('');
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const cancelProductForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductForm(BLANK_PRODUCT);
    setProductError('');
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    setProductError('');
    setProductSuccess('');

    // Basic validations
    if (!productForm.name.trim()) return setProductError('Product name is required.');
    if (!productForm.description.trim()) return setProductError('Description is required.');
    if (productForm.price === '' || Number(productForm.price) < 0) return setProductError('Valid price is required.');
    if (!productForm.category) return setProductError('Please select a category.');
    if (productForm.sizes.length === 0) return setProductError('Select at least one size.');
    if (productForm.colours.length === 0) return setProductError('Add at least one colour.');
    for (const col of productForm.colours) {
      if (!col.name.trim() || !col.image.trim()) {
        return setProductError('Each colour must have a name and image URL.');
      }
    }

    setProductLoading(true);

    const payload = {
      ...productForm,
      price: Number(productForm.price),
      stock: Number(productForm.stock) || 0,
    };

    try {
      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload);
        setProductSuccess('Product updated successfully!');
      } else {
        await api.post('/products', payload);
        setProductSuccess('Product created successfully!');
      }
      loadProducts();
      cancelProductForm();
    } catch (err) {
      setProductError(err.response?.data?.message || 'Could not save product.');
    } finally {
      setProductLoading(false);
    }
  };

  const deleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch {
      alert('Could not delete product.');
    }
  };

  // ── Category handlers ────────────────────────────────────────
  const startEditCategory = (cat) => {
    setEditingCatId(cat._id);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setCatError('');
    setCatSuccess('');
  };

  const cancelCatForm = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDescription('');
    setCatError('');
  };

  const submitCategory = async (e) => {
    e.preventDefault();
    setCatError('');
    setCatSuccess('');
    if (!catName.trim()) return setCatError('Category name is required.');
    setCatLoading(true);
    try {
      if (editingCatId) {
        await api.put(`/categories/${editingCatId}`, { name: catName, description: catDescription });
        setCatSuccess('Category updated!');
      } else {
        await api.post('/categories', { name: catName, description: catDescription });
        setCatSuccess('Category created!');
      }
      loadCategories();
      cancelCatForm();
    } catch (err) {
      setCatError(err.response?.data?.message || 'Could not save category.');
    } finally {
      setCatLoading(false);
    }
  };

  const deleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.delete(`/categories/${id}`);
      loadCategories();
    } catch {
      alert('Could not delete category.');
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'All') {
        const catId = p.category?._id || p.category;
        if (catId !== selectedCategory) return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = (p.name || '').toLowerCase().includes(term);
        const matchesDesc = (p.description || '').toLowerCase().includes(term);
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [products, selectedCategory, searchTerm]);

  return (
    <AdminLayout>
      <div className="breadcrumb">
        <Link to="/">Home</Link> &rsaquo; <Link to="/admin">Admin</Link> &rsaquo; Products
      </div>

      <div className="admin-page-header">
        <div>
          <h1>Product Management</h1>
          <p className="admin-page-subtitle">
            Manage your store catalog with the exact same THREADLY product presentation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            className="btn-secondary btn-sm"
            onClick={() => setShowCatPanel(!showCatPanel)}
          >
            {showCatPanel ? 'Hide Categories' : 'Manage Categories'}
          </button>
          {!showProductForm && (
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => {
                setShowProductForm(true);
                setEditingProductId(null);
                setProductForm(BLANK_PRODUCT);
                setProductError('');
                setProductSuccess('');
              }}
            >
              + Add Product
            </button>
          )}
        </div>
      </div>

      {productSuccess && <p className="form-success">{productSuccess}</p>}
      {productError && <p className="form-error">{productError}</p>}

      {/* ── ADD / EDIT PRODUCT FORM (THREADLY FORM-CARD STYLE) ── */}
      {showProductForm && (
        <section className="write-review-card" style={{ marginBottom: '32px' }}>
          <h3>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>

          <form onSubmit={submitProduct} className="review-form">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label>Product Name *</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(e) => handleProductField('name', e.target.value)}
                  placeholder="e.g. Classic Oversized Tee"
                />
              </div>

              <div className="form-group">
                <label>Category *</label>
                <select
                  value={productForm.category}
                  onChange={(e) => handleProductField('category', e.target.value)}
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.price}
                  onChange={(e) => handleProductField('price', e.target.value)}
                  placeholder="e.g. 599"
                />
              </div>

              <div className="form-group">
                <label>Stock Quantity *</label>
                <input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(e) => handleProductField('stock', e.target.value)}
                  placeholder="e.g. 50"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea
                rows={3}
                value={productForm.description}
                onChange={(e) => handleProductField('description', e.target.value)}
                placeholder="Product description and fabric specifications..."
              />
            </div>

            {/* Available Sizes */}
            <div className="form-group">
              <label>Available Sizes *</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px' }}>
                {ALL_SIZES.map((size) => (
                  <label key={size} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    <input
                      type="checkbox"
                      checked={productForm.sizes.includes(size)}
                      onChange={() => toggleSize(size)}
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Colours & Image URLs */}
            <div className="form-group">
              <label>Color Variants &amp; Image URLs *</label>
              <p style={{ fontSize: '0.82rem', color: '#666', marginBottom: '8px' }}>
                Provide colour name and image path (e.g. /images/products/classic-black.jpg or full URL).
              </p>
              {productForm.colours.map((col, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    placeholder="Colour name (e.g. Black)"
                    value={col.name}
                    onChange={(e) => handleColourChange(idx, 'name', e.target.value)}
                    style={{ flex: 1, minWidth: '130px' }}
                  />
                  <input
                    type="text"
                    placeholder="Image URL or relative path"
                    value={col.image}
                    onChange={(e) => handleColourChange(idx, 'image', e.target.value)}
                    style={{ flex: 2, minWidth: '220px' }}
                  />
                  {productForm.colours.length > 1 && (
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => removeColour(idx)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={addColour}
                style={{ marginTop: '4px' }}
              >
                + Add Another Colour
              </button>
            </div>

            {/* Active Visibility Flag */}
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={productForm.isActive}
                  onChange={(e) => handleProductField('isActive', e.target.checked)}
                />
                <span style={{ fontSize: '0.9rem' }}>Active (Visible to customers on shop page)</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button type="submit" className="btn-primary" disabled={productLoading}>
                {productLoading ? 'Saving...' : editingProductId ? 'Update Product' : 'Save Product'}
              </button>
              <button type="button" className="btn-secondary" onClick={cancelProductForm}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── TOOLBAR (SEARCH, CATEGORY FILTER, GRID/TABLE TOGGLE) ── */}
      <div className="admin-products-toolbar">
        <div className="admin-products-search">
          <input
            type="text"
            placeholder="Search products by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px', fontSize: '0.9rem', background: '#fff' }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>

          <div className="admin-view-toggles">
            <button
              type="button"
              className={`admin-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid View
            </button>
            <button
              type="button"
              className={`admin-view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {loading && <p className="page-loading">Loading catalog products...</p>}

      {/* ── GRID VIEW (MATCHES SHOP/PRODUCT CARD STYLE) ── */}
      {!loading && viewMode === 'grid' && (
        <div className="shop-grid">
          {filteredProducts.map((product) => {
            const rawImage = product.colours?.[0]?.image || '';
            const displayImage = getImageUrl(rawImage);

            const stockLabel =
              product.stock === 0
                ? 'Out of Stock'
                : product.stock <= 10
                ? `Only ${product.stock} left`
                : 'In Stock';

            const stockClass =
              product.stock === 0 ? 'badge-out' : product.stock <= 10 ? 'badge-low' : 'badge-in';

            return (
              <div key={product._id} className="product-card-shop">
                <div className="product-card-img-wrap">
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="product-card-img"
                    onError={(e) => handleImageErrorWithFallback(e, rawImage, FALLBACK_IMAGE)}
                  />
                </div>

                <div className="product-card-body">
                  {product.category && (
                    <span className="product-category-tag">{product.category.name}</span>
                  )}

                  <h3 className="product-card-name">{product.name}</h3>
                  <p className="product-card-price">₹{product.price.toLocaleString()}</p>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <span className={`stock-badge ${stockClass}`}>{stockLabel}</span>
                    <span className={`stock-badge ${product.isActive ? 'badge-in' : 'badge-out'}`}>
                      {product.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </div>

                  {/* Edit & Delete Buttons */}
                  <div className="admin-product-card-actions">
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => startEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => deleteProduct(product._id, product.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <p className="page-loading" style={{ gridColumn: '1 / -1' }}>
              No products found matching your filter.
            </p>
          )}
        </div>
      )}

      {/* ── TABLE VIEW (SIMPLE TABLE MATCHING THREADLY STYLE) ── */}
      {!loading && viewMode === 'table' && (
        <div className="admin-table-container">
          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img
                        src={getImageUrl(product.colours?.[0]?.image)}
                        alt={product.name}
                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', background: '#f5f5f5' }}
                        onError={(e) => handleImageErrorWithFallback(e, product.colours?.[0]?.image, FALLBACK_IMAGE)}
                      />
                      <div>
                        <strong>{product.name}</strong>
                        <div style={{ fontSize: '0.8rem', color: '#666' }}>
                          {product.colours?.length || 0} colorway(s)
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{product.category?.name || '—'}</td>
                  <td><strong>₹{product.price}</strong></td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`stock-badge ${product.isActive ? 'badge-in' : 'badge-out'}`}>
                      {product.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-edit"
                      onClick={() => startEditProduct(product)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-delete"
                      onClick={() => deleteProduct(product._id, product.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="6" className="table-empty">No products found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CATEGORY MANAGEMENT PANEL ── */}
      {showCatPanel && (
        <section className="admin-category-panel">
          <h2>Category Management</h2>

          {catError && <p className="form-error">{catError}</p>}
          {catSuccess && <p className="form-success">{catSuccess}</p>}

          <form onSubmit={submitCategory} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="Category name *"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              style={{ flex: 1, minWidth: '180px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
              style={{ flex: 2, minWidth: '220px', padding: '8px 12px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button type="submit" className="btn-primary btn-sm" disabled={catLoading}>
              {editingCatId ? 'Update' : 'Add Category'}
            </button>
            {editingCatId && (
              <button type="button" className="btn-secondary btn-sm" onClick={cancelCatForm}>
                Cancel
              </button>
            )}
          </form>

          <table className="admin-orders-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.description || '—'}</td>
                  <td>
                    <button type="button" className="btn-edit" onClick={() => startEditCategory(c)}>Edit</button>
                    <button type="button" className="btn-delete" onClick={() => deleteCategory(c._id, c.name)}>Delete</button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan="3" className="table-empty">No categories configured yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      )}
    </AdminLayout>
  );
}

export default AdminProducts;
