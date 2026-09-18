import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RaiseRequest = () => {
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const [assignedSupplier, setAssignedSupplier] = useState(null);
  const [loadingSupplier, setLoadingSupplier] = useState(false);

  const [quantity, setQuantity] = useState(1);
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. Fetch Categories on Mount with safety extraction
  useEffect(() => {
    fetch('http://localhost:8082/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        console.log('Fetched categories response:', data);
        // Supports direct arrays or objects wrapping the list (e.g. data.content, data.data)
        const categoryList = Array.isArray(data) 
          ? data 
          : data.content || data.data || data.categories || [];
        setCategories(categoryList);
      })
      .catch((err) => {
        console.error('Error fetching categories:', err);
        setCategories([]);
      });
  }, []);

  // 2. Handle Category Change: Fetch Products AND Auto-Map Supplier by Category ID
  const handleCategoryChange = async (e) => {
    const categoryId = e.target.value;
    setSelectedCategoryId(categoryId);
    setSelectedProduct(null);
    setAssignedSupplier(null);

    if (categoryId) {
      // Find the selected category object to get its name for product filtering
      const foundCat = categories.find((c) => String(c.categoryId) === String(categoryId));
      const categoryName = foundCat ? foundCat.categoryName : '';

      // A. Fetch Products matching this category name
      if (categoryName) {
        fetch(`http://localhost:8082/api/products/category/${encodeURIComponent(categoryName)}`)
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            return res.json();
          })
          .then((data) => {
            setProducts(Array.isArray(data) ? data : []);
          })
          .catch((err) => {
            console.error('Error fetching products:', err);
            setProducts([]);
          });
      }

      // B. Auto-Map Supplier based on Category ID from the Supplier table
      setLoadingSupplier(true);
      try {
        const response = await fetch(`http://localhost:8082/api/suppliers/by-category/${categoryId}`);
        if (response.ok) {
          const supplierData = await response.json();
          setAssignedSupplier(supplierData);
        } else {
          setAssignedSupplier(null);
        }
      } catch (err) {
        console.error('Error auto-mapping supplier:', err);
        setAssignedSupplier(null);
      } finally {
        setLoadingSupplier(false);
      }
    } else {
      setProducts([]);
      setAssignedSupplier(null);
    }
  };

  // 3. Handle Product Selection
  const handleProductChange = (e) => {
    const prodId = e.target.value;
    const foundProduct = products.find((p) => p.productId.toString() === prodId);
    setSelectedProduct(foundProduct || null);
  };

  // 4. Submit Request to Backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      alert('Please select a valid product.');
      return;
    }

    if (!selectedCategoryId) {
      alert('Please select a valid category.');
      return;
    }

    // Retrieves logged-in user ID from localStorage or defaults to 1
    const userId = Number(localStorage.getItem('userId')) || 1;

    setLoading(true);
    try {
      const payload = {
        userId: userId,
        productId: selectedProduct.productId,
        categoryId: Number(selectedCategoryId),
        supplierId: assignedSupplier ? assignedSupplier.supplierId : null,
        quantity: Number(quantity),
        justification: justification
      };

      const response = await fetch('http://localhost:8082/api/procurement-requests', {
        method: 'POST',
        headers: {  
          'Content-Type': 'application/json'  
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert('Procurement request submitted successfully!');
        navigate('/dashboard'); 
      } else {
        const errData = await response.json().catch(() => ({ message: 'Server error' }));
        alert(`Submission failed (${response.status}): ${errData.message || 'Check backend logs'}`);
      }
    } catch (err) {
      console.error('Submission error details:', err);
      alert(`Network Error: ${err.message}. Make sure your backend server is running.`);
    } finally {
      setLoading(false);
    }
  };

  const unitPrice = selectedProduct ? selectedProduct.pricePerProduct : 0;
  const totalValue = unitPrice * quantity;

  return (
    <div style={styles.card}>
      <h2 style={styles.title}>Raise Procurement Request</h2>
      
      <form onSubmit={handleSubmit}>
        {/* Category Dropdown */}
        <div style={styles.group}>
          <label style={styles.label}>Category</label>
          <select 
            style={styles.input} 
            value={selectedCategoryId} 
            onChange={handleCategoryChange} 
            required
          >
            <option value="">-- Select Category --</option>
            {Array.isArray(categories) && categories.map((cat) => (
              <option key={cat.categoryId} value={cat.categoryId}>
                {cat.categoryName}
              </option>
            ))}
          </select>
        </div>

        {/* Product Dropdown */}
        <div style={styles.group}>
          <label style={styles.label}>Product</label>
          <select 
            style={styles.input} 
            value={selectedProduct ? selectedProduct.productId : ''} 
            onChange={handleProductChange} 
            disabled={!selectedCategoryId || !Array.isArray(products) || products.length === 0}
            required
          >
            <option value="">
              {!selectedCategoryId 
                ? '-- Select Category First --' 
                : products.length === 0 
                ? '-- No Products Found --' 
                : '-- Select Product --'}
            </option>
            {Array.isArray(products) && products.map((prod) => (
              <option key={prod.productId} value={prod.productId}>
                {prod.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pricing & Auto-Mapped Supplier Details Box */}
        <div style={styles.row}>
          <div style={styles.box}>
            <span style={styles.boxLabel}>Price per Unit</span>
            <h3 style={styles.boxValue}>₹{unitPrice.toLocaleString('en-IN')}.00</h3>
          </div>
          <div style={styles.box}>
            <span style={styles.boxLabel}>Auto-Mapped Supplier</span>
            <h3 style={styles.boxValue}>
              {loadingSupplier 
                ? 'Mapping supplier...' 
                : assignedSupplier?.name || 'Auto-fallback active'}
            </h3>
          </div>
        </div>

        {/* Quantity Controls */}
        <div style={styles.group}>
          <label style={styles.label}>Quantity</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              type="button" 
              onClick={() => setQuantity(Math.max(1, quantity - 1))} 
              style={styles.qtyBtn}
            >
              -
            </button>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', minWidth: '24px', textAlign: 'center' }}>
              {quantity}
            </span>
            <button 
              type="button" 
              onClick={() => setQuantity(quantity + 1)} 
              style={styles.qtyBtn}
            >
              +
            </button>
          </div>
        </div>

        {/* Total Cost Banner */}
        <div style={styles.totalBanner}>
          <span>Total Request Value</span>
          <h2 style={{ margin: 0 }}>₹{totalValue.toLocaleString('en-IN')}.00</h2>
        </div>

        {/* Justification Input */}
        <div style={styles.group}>
          <label style={styles.label}>Justification / Reason</label>
          <textarea
            style={styles.textarea}
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explain why this request is required..."
            required
          />
        </div>

        <button type="submit" disabled={loading} style={styles.submitBtn}>
          {loading ? 'Submitting Request...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  card: { maxWidth: '600px', margin: '2rem auto', padding: '2rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  title: { marginTop: 0, marginBottom: '1.5rem', color: '#0f172a' },
  group: { marginBottom: '1.25rem' },
  label: { display: 'block', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', boxSizing: 'border-box' },
  textarea: { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', minHeight: '90px', fontFamily: 'inherit', boxSizing: 'border-box' },
  row: { display: 'flex', gap: '1rem', marginBottom: '1.25rem' },
  box: { flex: 1, padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  boxLabel: { fontSize: '0.85rem', color: '#64748b' },
  boxValue: { margin: '0.25rem 0 0 0', fontSize: '1.1rem', color: '#0f172a' },
  qtyBtn: { width: '36px', height: '36px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer', backgroundColor: '#f1f5f9', fontSize: '1.2rem', fontWeight: 'bold' },
  totalBanner: { backgroundColor: '#0284c7', color: '#ffffff', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' },
  submitBtn: { width: '100%', padding: '0.85rem', backgroundColor: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }
};

export default RaiseRequest;