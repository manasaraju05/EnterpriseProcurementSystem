import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalOrders: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const supplierId = localStorage.getItem('supplierId') 
    || storedUser.supplierId 
    || storedUser.id 
    || storedUser.userId;
  const token = localStorage.getItem('token');

  // Extracts Fulfillment Status 
  const getFulfillmentStatus = (item) => {
    if (!item || !item.status) return 'PENDING';
    return typeof item.status === 'string' ? item.status.toUpperCase() : (item.status.name || '').toUpperCase();
  };

  const fetchSupplierData = useCallback(async () => {
    if (!supplierId || !token) {
      navigate('/login');
      return;
    }

    try {
      const ordersRes = await fetch(`http://localhost:8082/api/suppliers/${supplierId}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (ordersRes.status === 401 || ordersRes.status === 403) {
        handleLogout();
        return;
      }

      if (ordersRes.ok) {
        const orderData = await ordersRes.json();
        const fetchedOrders = Array.isArray(orderData) ? orderData : [];

        // Sort new orders to the top
        fetchedOrders.sort((a, b) => {
          const idA = a.requestId || a.request_id || a.id || 0;
          const idB = b.requestId || b.request_id || b.id || 0;
          return idB - idA;
        });

        setOrders(fetchedOrders);
      }

      const statsRes = await fetch(`http://localhost:8082/api/suppliers/${supplierId}/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error fetching supplier portal data:', err);
    } finally {
      setLoading(false);
    }
  }, [supplierId, token, navigate]);

  useEffect(() => {
    fetchSupplierData();
  }, [fetchSupplierData]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    // 1. Optimistic UI Update for instant feedback
    setOrders(prevOrders =>
      prevOrders.map(order => {
        const currentId = order.requestId || order.request_id || order.id;
        return currentId === orderId ? { ...order, status: newStatus } : order;
      })
    );

    // 2. Send update to Backend Controller
    try {
      const response = await fetch(`http://localhost:8082/api/suppliers/orders/${orderId}/status?status=${encodeURIComponent(newStatus)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // EXPLICIT ERROR HANDLING
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        alert(`Update Failed: ${err.message || err.error || 'Server rejected the status update.'}`);
        await fetchSupplierData(); // Revert the UI to the actual database state
        return;
      }

      // Refresh background data on success
      await fetchSupplierData();
    } catch (error) {
      console.error('Network error during status sync:', error);
      alert('Network error. Could not connect to the backend server.');
      await fetchSupplierData(); // Revert the UI on network failure
    }
  };

  const handleLogout = () => {
    setOrders([]);
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <div>
      <header className="glass-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 3rem',
      }}>
        <Logo size={36} textColor="#0F172A" />
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.35rem 0.85rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
            SUPPLIER PORTAL (ID: {supplierId || 'N/A'})
          </span>
          <button 
            className="btn-3d"
            onClick={handleLogout}
            style={{ padding: '0.5rem 1.25rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
          >
            Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 1.5rem' }}>
        
        <div style={{ marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em', color: '#38bdf8', textTransform: 'uppercase' }}>
            Vendor Management
          </span>
          <h1 style={{ fontSize: '2.4rem', color: '#ffffff', margin: '0.25rem 0', fontWeight: '800' }}>
            Supplier Dashboard
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.05rem' }}>
            View incoming purchase orders and track fulfillment statuses.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card-3d">
            <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem', display: 'inline-block', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>📦</div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Assigned</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
                {stats.totalOrders ?? stats.totalAssignedOrders ?? orders.length}
              </div>
            </div>
          </div>

          <div className="card-3d">
            <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem', display: 'inline-block', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>⏳</div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Fulfillment</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#d97706', marginTop: '0.25rem' }}>
                {stats.pending ?? stats.pendingFulfillment ?? orders.filter(o => {
                  const s = getFulfillmentStatus(o);
                  return s === 'PENDING' || s === 'APPROVED';
                }).length}
              </div>
            </div>
          </div>

          <div className="card-3d">
            <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem', display: 'inline-block', padding: '0.5rem', backgroundColor: '#dcfce7', borderRadius: '8px' }}>✅</div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a', marginTop: '0.25rem' }}>
                {stats.completed ?? stats.completedFulfillment ?? orders.filter(o => {
                  const s = getFulfillmentStatus(o);
                  return s === 'DELIVERED' || s === 'FULFILLED' || s === 'COMPLETED';
                }).length}
              </div>
            </div>
          </div>
        </div>

        <div className="panel-3d">
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#1e293b', fontSize: '1.25rem' }}>Assigned Purchase Orders</h3>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500', animation: 'pulse 2s infinite' }}>Loading your orders securely...</p>
            </div>
          ) : orders.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</span>
              <p style={{ color: '#64748b', fontWeight: '500' }}>No purchase orders currently assigned to your supplier ID.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '1rem' }}>Order ID</th>
                    <th style={{ padding: '1rem' }}>Product / Description</th>
                    <th style={{ padding: '1rem' }}>Qty</th>
                    <th style={{ padding: '1rem' }}>Amount</th>
                    <th style={{ padding: '1rem' }}>Payment</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.95rem', color: '#334155' }}>
                  {orders.map((order) => {
                    const orderId = order.requestId || order.request_id || order.id;
                    const productName = order.product?.name || order.productName || order.justification || 'N/A';
                    const quantity = order.quantity || 1;
                    const amount = order.totalAmount || order.total_amount || 0;
                    
                    const fulfillmentStatus = getFulfillmentStatus(order);
                    
                    // DIRECT DATABASE READ: No more localStorage hacks
                    const rawPaymentStat = order.paymentStatus || order.payment_status || order.payment?.status || 'UNPAID';
                    const paymentStatusDisplay = typeof rawPaymentStat === 'string' ? rawPaymentStat.toUpperCase() : (rawPaymentStat.name || 'UNPAID').toUpperCase();
                    const isPaid = paymentStatusDisplay === 'PAID';

                    const isDelivered = fulfillmentStatus === 'DELIVERED' || fulfillmentStatus === 'FULFILLED' || fulfillmentStatus === 'COMPLETED';
                    const isOutOfStock = fulfillmentStatus.includes('OUT') || fulfillmentStatus.includes('STOCK') || fulfillmentStatus === 'OUT_OF_STOCK' || fulfillmentStatus === 'OUT-OF-STOCK' || fulfillmentStatus === 'OUTOFSTOCK';
                    
                    const isAnyActionTaken = isDelivered || isOutOfStock;

                    return (
                      <tr key={orderId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '1rem', fontWeight: '700', color: '#0f172a' }}>#{orderId}</td>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>{productName}</td>
                        <td style={{ padding: '1rem' }}>{quantity}</td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{amount ? `₹${amount.toLocaleString('en-IN')}` : 'N/A'}</td>
                        
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: isPaid ? '#dcfce7' : '#fef3c7',
                            color: isPaid ? '#166534' : '#b45309',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            {paymentStatusDisplay}
                          </span>
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: isDelivered ? '#dcfce7' : isOutOfStock ? '#fee2e2' : '#fef3c7',
                            color: isDelivered ? '#166534' : isOutOfStock ? '#991b1b' : '#92400e',
                            border: '1px solid rgba(0,0,0,0.05)',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            {fulfillmentStatus}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              disabled={isAnyActionTaken}
                              onClick={() => handleUpdateStatus(orderId, 'OUT_OF_STOCK')}
                              className={isAnyActionTaken ? "" : "btn-3d"}
                              style={{ 
                                padding: '0.4rem 0.8rem', 
                                backgroundColor: isAnyActionTaken ? '#cbd5e1' : '#f59e0b', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '6px', 
                                fontSize: '0.8rem', 
                                fontWeight: '700',
                                cursor: isAnyActionTaken ? 'not-allowed' : 'pointer',
                                opacity: isAnyActionTaken ? 0.6 : 1 
                              }}
                            >
                              Out of Stock
                            </button>

                            <button
                              disabled={isAnyActionTaken}
                              onClick={() => handleUpdateStatus(orderId, 'DELIVERED')}
                              className={isAnyActionTaken ? "" : "btn-3d"}
                              style={{ 
                                padding: '0.4rem 0.8rem', 
                                backgroundColor: isAnyActionTaken ? '#cbd5e1' : '#10b981', 
                                color: '#fff', 
                                border: 'none', 
                                borderRadius: '6px', 
                                fontSize: '0.8rem', 
                                fontWeight: '700',
                                cursor: isAnyActionTaken ? 'not-allowed' : 'pointer',
                                opacity: isAnyActionTaken ? 0.6 : 1 
                              }}
                            >
                              Delivered
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SupplierDashboard;