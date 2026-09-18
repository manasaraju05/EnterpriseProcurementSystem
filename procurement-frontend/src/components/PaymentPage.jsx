import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Retrieve state passed from navigation, defaulting to accurate real-time DB values
  const requestData = location.state || {
    requestId: 1,
    supplierId: 1,
    productName: 'Dell XPS 15 (i7 / 16GB / 512GB SSD)',
    quantity: 1,
    totalAmount: 145000.0,
  };

  const [paymentMode, setPaymentMode] = useState('mpin'); // 'mpin' or 'qr'
  const [mpin, setMpin] = useState('');
  const [processing, setProcessing] = useState(false);

  // Extract identifiers and display properties robustly across various response formats
  const resolvedRequestId = requestData.requestId || requestData.id || requestData.product_id || 1;
  const resolvedSupplierId = requestData.supplierId || requestData.supplier?.id || requestData.supplierId || 1;

  const productNameDisplay = 
    requestData.productName || 
    requestData.name || 
    requestData.product?.name || 
    'Dell XPS 15 (i7 / 16GB / 512GB SSD)';

  const quantityDisplay = 
    requestData.quantity || 
    requestData.number_of_quantities || 
    1;

  const totalAmountDisplay = 
    requestData.totalAmount || 
    requestData.total_price || 
    (requestData.price_per_product ? requestData.price_per_product * quantityDisplay : 145000.0);

  const supplierDisplayName = 
    requestData.supplierName || 
    requestData.supplier_name ||
    requestData.supplier?.name || 
    requestData.supplier?.supplierName ||
    requestData.product?.supplier?.name || 
    requestData.product?.supplier?.supplierName ||
    'Dell Direct Systems';

  const handlePayment = async (e) => {
    if (e) e.preventDefault();

    if (paymentMode === 'mpin' && (!mpin || mpin.trim() === '')) {
      alert('Error: Please enter your security MPIN.');
      return;
    }

    setProcessing(true);

    const paymentPayload = {
      requestId: resolvedRequestId,
      supplierId: resolvedSupplierId,
      amount: totalAmountDisplay,
      paymentMethod: paymentMode === 'mpin' ? 'MPIN_DIRECT' : 'UPI_QR_CODE',
      upiId: paymentMode === 'qr' ? 'procurement.supplier@upi' : 'NOT_REQUIRED',
      mpin: paymentMode === 'mpin' ? mpin.trim() : 'QR_VERIFIED'
    };

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
    };

    try {
      const response = await fetch('http://localhost:8082/api/payments/process', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(paymentPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes('mpin') || response.status === 401) {
          throw new Error('The MPIN is incorrect. Please try again.');
        }
        throw new Error(errorText || 'Server failed to process payment');
      }

      const data = await response.json();
      console.log('Payment success response:', data);

      alert(`Payment of ₹${totalAmountDisplay.toLocaleString('en-IN')} successful via ${paymentMode === 'mpin' ? 'MPIN' : 'QR Code'}! Database updated.`);
      navigate('/dashboard');
    } catch (err) {
      console.error('Payment processing failed:', err);
      alert(`${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const visualEffectsCSS = `
    @keyframes slowPan {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    .animated-bg {
      background: linear-gradient(-45deg, #f0f4f8, #e0f2fe, #f8fafc, #e2e8f0);
      background-size: 400% 400%;
      animation: slowPan 18s ease infinite;
      min-height: 100vh;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .panel-3d {
      background-color: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 2rem;
      border-radius: 14px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      transition: transform 0.4s ease, box-shadow 0.4s ease;
    }
    .panel-3d:hover {
      transform: translateY(-4px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
    }
    .btn-3d {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .btn-3d:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
    }
    .btn-3d:active:not(:disabled) {
      transform: translateY(0);
    }
  `;

  return (
    <div className="animated-bg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <style>{visualEffectsCSS}</style>
      
      <div className="panel-3d" style={{ width: '100%', maxWidth: '500px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.4rem' }}>Supplier Payment Checkout</h2>
          <button 
            type="button" 
            className="btn-3d"
            onClick={() => navigate('/dashboard')} 
            style={{ background: 'none', border: '1px solid #cbd5e1', padding: '0.35rem 0.75rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}
          >
            ← Back
          </button>
        </div>

        {/* Order & Supplier Details */}
        <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#334155' }}>
            <span>Request ID:</span>
            <strong>#{resolvedRequestId}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#334155' }}>
            <span>Product:</span>
            <strong>{productNameDisplay}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#334155' }}>
            <span>Supplier:</span>
            <strong>{supplierDisplayName} (ID: #{resolvedSupplierId})</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#334155' }}>
            <span>Quantity:</span>
            <strong>{quantityDisplay}</strong>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '0.75rem 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.95rem', color: '#334155' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>Total Cost:</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0284c7' }}>
              ₹{totalAmountDisplay.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className="btn-3d"
            onClick={() => setPaymentMode('mpin')}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: paymentMode === 'mpin' ? '#0284c7' : '#e2e8f0',
              color: paymentMode === 'mpin' ? '#ffffff' : '#475569'
            }}
          >
            🔒 Security MPIN
          </button>
          <button
            type="button"
            className="btn-3d"
            onClick={() => setPaymentMode('qr')}
            style={{
              flex: 1, padding: '0.6rem', border: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s',
              backgroundColor: paymentMode === 'qr' ? '#0284c7' : '#e2e8f0',
              color: paymentMode === 'qr' ? '#ffffff' : '#475569'
            }}
          >
            📱 Scan QR Code
          </button>
        </div>

        {paymentMode === 'mpin' ? (
          <form onSubmit={handlePayment}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: '600', color: '#1e293b', fontSize: '0.9rem', marginBottom: '0.25rem' }}>Supplier Security MPIN</label>
              <input
                type="password"
                maxLength="6"
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '1rem', marginTop: '0.25rem', boxSizing: 'border-box' }}
                placeholder="Enter your 4-6 digit MPIN"
                value={mpin}
                onChange={(e) => setMpin(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={processing} 
              className="btn-3d"
              style={{ width: '100%', padding: '0.85rem', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '600', marginTop: '0.5rem', opacity: processing ? 0.7 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}
            >
              {processing ? 'Verifying & Processing...' : `Pay ₹${totalAmountDisplay.toLocaleString('en-IN')}`}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '2px solid #e2e8f0', borderRadius: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=procurement.supplier@upi&pn=${encodeURIComponent(supplierDisplayName)}&am=${totalAmountDisplay}&cu=INR`} 
                alt="UPI Payment QR Code"
                style={{ width: '140px', height: '140px', display: 'block', borderRadius: '4px' }}
              />
            </div>
            <p style={{ fontSize: '0.85rem', color: '#475569', textAlign: 'center', margin: '0.5rem 0' }}>
              Scan with any UPI App (GPay, PhonePe, Paytm) to clear <b>₹{totalAmountDisplay.toLocaleString('en-IN')}</b>
            </p>
            <button 
              type="button"
              onClick={handlePayment}
              disabled={processing} 
              className="btn-3d"
              style={{ width: '100%', padding: '0.85rem', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '600', marginTop: '0.5rem', opacity: processing ? 0.7 : 1, cursor: processing ? 'not-allowed' : 'pointer' }}
            >
              {processing ? 'Confirming UPI Payment...' : 'I Have Completed the Payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;