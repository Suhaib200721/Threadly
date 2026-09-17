import { useState, useEffect } from 'react';
import api from '../services/api';

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
  const [catError, setCatError] = useState('');
  const [catSuccess, setCatSuccess] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  // Fetch products and categories on mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = () => {
    api.get('/products/admin/all')
      .then((res) => setProducts(res.data.products))
      .catch(() => setProductError('Could not load products.'));
  };

  const loadCategories = () => {
    api.get('/categories')
      .then((res) => setCategories(res.data.categories))
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
      category: product.category?._id || '',
      sizes: product.sizes,
      colours: product.colours,
      isActive: product.isActive,
    });
    setShowProductForm(true);
    setProductError('');
    setProductSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelProductForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductForm(BLANK_PRODUCT);
    setProductError('');
    setProductSuccess('');
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    setProductError('');
    setProductSuccess('');

    // Basic client-side validation
    if (!productForm.name.trim()) return setProductError('Product name is required.');
    if (!productForm.description.trim()) return setProductError('Description is required.');
    if (!productForm.price || Number(productForm.price) < 0) return setProductError('Valid price is required.');
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
    setCatSuccess('');
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

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="admin-page">
      <h1>Admin — Product Management</h1>

      {/* ══════════════════════════════════════════════════════
          CATEGORIES SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="admin-section">
        <h2>Categories</h2>

        {catError && <p className="form-error">{catError}</p>}
        {catSuccess && <p className="form-success">{catSuccess}</p>}

        {/* Category form */}
        <form className="admin-form-inline" onSubmit={submitCategory}>
          <input
            type="text"
            placeholder="Category name *"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Description (optional)"
            value={catDescription}
            onChange={(e) => setCatDescription(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={catLoading}>
            {editingCatId ? 'Update' : 'Add Category'}
          </button>
          {editingCatId && (
            <button type="button" className="btn-secondary" onClick={cancelCatForm}>
              Cancel
            </button>
          )}
        </form>

        {/* Category list */}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat._id}>
                <td>{cat.name}</td>
                <td>{cat.description || '—'}</td>
                <td>
                  <button className="btn-edit" onClick={() => startEditCategory(cat)}>Edit</button>
                  <button className="btn-delete" onClick={() => deleteCategory(cat._id, cat.name)}>Delete</button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && (
              <tr><td colSpan="3" className="table-empty">No categories yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRODUCTS SECTION
      ══════════════════════════════════════════════════════ */}
      <section className="admin-section">
        <div className="admin-section-header">
          <h2>Products</h2>
          {!showProductForm && (
            <button className="btn-primary" onClick={() => setShowProductForm(true)}>
              + Add Product
            </button>
          )}
        </div>

        {/* ── Product Form ───────────────────────────────── */}
        {showProductForm && (
          <div className="admin-form-card">
            <h3>{editingProductId ? 'Edit Product' : 'Add New Product'}</h3>

            {productError && <p className="form-error">{productError}</p>}
            {productSuccess && <p className="form-success">{productSuccess}</p>}

            <form onSubmit={submitProduct}>
              <div className="form-row-2">
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
                    <option value="">-- Select category --</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={productForm.description}
                  onChange={(e) => handleProductField('description', e.target.value)}
                  rows={3}
                  placeholder="Describe the product..."
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.price}
                    onChange={(e) => handleProductField('price', e.target.value)}
                    placeholder="e.g. 549"
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => handleProductField('stock', e.target.value)}
                    placeholder="e.g. 100"
                  />
                </div>
              </div>

              {/* Sizes */}
              <div className="form-group">
                <label>Sizes * (select at least one)</label>
                <div className="size-check-group">
                  {ALL_SIZES.map((size) => (
                    <label key={size} className="size-check-label">
                      <input
                        type="checkbox"
                        checked={productForm.sizes.includes(size)}
                        onChange={() => toggleSize(size)}
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </div>

              {/* Colours */}
              <div className="form-group">
                <label>Colours * (each colour needs a name and image URL)</label>
                {productForm.colours.map((col, index) => (
                  <div key={index} className="colour-row">
                    <input
                      type="text"
                      placeholder="Colour name (e.g. Black)"
                      value={col.name}
                      onChange={(e) => handleColourChange(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Image URL"
                      value={col.image}
                      onChange={(e) => handleColourChange(index, 'image', e.target.value)}
                    />
                    {productForm.colours.length > 1 && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => removeColour(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn-secondary" onClick={addColour}>
                  Add Colour
                </button>
              </div>

              {/* Active toggle */}
              <div className="form-group">
                <label className="size-check-label">
                  <input
                    type="checkbox"
                    checked={productForm.isActive}
                    onChange={(e) => handleProductField('isActive', e.target.checked)}
                  />
                  Active (visible in shop)
                </label>
              </div>

              <div className="form-btn-row">
                <button type="submit" className="btn-primary" disabled={productLoading}>
                  {productLoading ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
                </button>
                <button type="button" className="btn-secondary" onClick={cancelProductForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Products Table ──────────────────────────────── */}
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Colours</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td>{product.name}</td>
                <td>{product.category?.name || '—'}</td>
                <td>₹{product.price}</td>
                <td>{product.stock}</td>
                <td>{product.colours.map((c) => c.name).join(', ')}</td>
                <td>
                  <span className={product.isActive ? 'badge-in' : 'badge-out'}>
                    {product.isActive ? 'Active' : 'Hidden'}
                  </span>
                </td>
                <td>
                  <button className="btn-edit" onClick={() => startEditProduct(product)}>Edit</button>
                  <button className="btn-delete" onClick={() => deleteProduct(product._id, product.name)}>Delete</button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan="7" className="table-empty">No products yet. Click "+ Add Product" to start.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AdminProducts;
