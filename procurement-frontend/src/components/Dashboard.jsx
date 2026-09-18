import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import ProductRatingModal from './ProductRatingModal'; 

const Dashboard = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Track which request is currently being rated
  const [ratingModalRequest, setRatingModalRequest] = useState(null);
  
  // Check user role & ID from localStorage
  const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = localStorage.getItem('role') || storedUser.role || 'USER';
  const isAdmin = userRole.toUpperCase() === 'ADMIN' || localStorage.getItem('isAdmin') === 'true';
  const currentUserId = storedUser.userId || storedUser.id || localStorage.getItem('userId');

  // Safe status string extractor
  const getStatusString = (item) => {
    if (!item || !item.status) return 'PENDING';
    if (typeof item.status === 'string') return item.status.toUpperCase();
    if (typeof item.status === 'object' && item.status.name) return item.status.name.toUpperCase();
    return String(item.status).toUpperCase();
  };

  // DIRECT DATABASE READ: Safe payment status string extractor
  const getPaymentStatusString = (item) => {
    const payment = item.paymentStatus || item.payment_status || item.payment?.status;

    if (payment) {
      if (typeof payment === 'string') return payment.toUpperCase();
      if (typeof payment === 'object' && payment.name) return payment.name.toUpperCase();
    }
    
    return 'UNPAID';
  };

  // Fetch procurement requests from Spring Boot backend
  const fetchRequests = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8082/api/procurement-requests');
      if (!res.ok) throw new Error('Failed to fetch requests');
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : [];

      // If USER mode, filter by logged-in userId
      const filteredData = (!isAdmin && currentUserId)
        ? rawList.filter((item) => {
            const itemUserId = item.user?.userId || item.user?.id || item.userId || item.user_id;
            return String(itemUserId) === String(currentUserId);
          })
        : rawList;

      // Sort by newest first
      filteredData.sort((a, b) => {
        const idA = a.requestId || a.request_id || a.id || 0;
        const idB = b.requestId || b.request_id || b.id || 0;
        return idB - idA;
      });

      setRequests(filteredData);
    } catch (err) {
      console.error('Error fetching procurement_requests:', err);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, currentUserId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Status counters
  const totalRaised = requests.length;

  const pendingCount = requests.filter((r) => {
    const status = getStatusString(r);
    return status.includes('PEND') || status === 'SUBMITTED';
  }).length;

  const approvedCount = requests.filter((r) => {
    const status = getStatusString(r);
    return status.includes('APPR') || status.includes('PAID') || status === 'COMPLETED' || status === 'DELIVERED';
  }).length;

  const rejectedCount = requests.filter((r) => {
    const status = getStatusString(r);
    return status.includes('REJE') || status === 'DECLINED' || status === 'OUT_OF_STOCK';
  }).length;

  // Handle Approval and Navigate to Payment Page
  const handleApproveAndPay = async (item) => {
    const reqId = item.requestId || item.request_id || item.id;
    
    setRequests((prev) =>
      prev.map((req) => {
        const id = req.requestId || req.request_id || req.id;
        return id === reqId ? { ...req, status: 'APPROVED' } : req;
      })
    );

    const extractedSupplierId = 
      item.supplier?.supplierId || 
      item.supplier?.id || 
      item.product?.supplier?.supplierId || 
      item.product?.supplier?.id || 
      item.supplierId || 
      item.supplier_id || 
      1;

    const navState = {
      requestId: reqId,
      supplierId: extractedSupplierId,
      productName: item.product?.name || item.productName || 'Procurement Item',
      supplierName: item.product?.supplier?.name || item.supplier?.name || item.supplierName || 'Auto-mapped Supplier',
      quantity: item.quantity || 1,
      totalAmount: item.totalAmount || item.total_amount || 0
    };

    try {
      await fetch(`http://localhost:8082/api/procurement-requests/${reqId}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'APPROVED',
          adminDescription: 'Approved by admin'
        }),
      });

      await fetchRequests();
      navigate('/payment', { state: navState });
    } catch (error) {
      console.error('Error approving request:', error);
      navigate('/payment', { state: navState });
    }
  };

  // Reject Status Handler
  const handleReject = async (requestId) => {
    setRequests((prev) =>
      prev.map((req) => {
        const reqId = req.requestId || req.request_id || req.id;
        return reqId === requestId ? { ...req, status: 'REJECTED' } : req;
      })
    );

    try {
      const response = await fetch(`http://localhost:8082/api/procurement-requests/${requestId}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'REJECTED',
          adminDescription: 'Rejected by admin'
        }),
      });

      if (response.ok) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error rejecting status:', error);
    }
  };

  // CSV Export Handler
  const handleDownload = () => {
    if (!requests || requests.length === 0) {
      alert('No data available to download.');
      return;
    }

    const headers = [
      'Product ID',
      'Product Name',
      'Quantity',
      'Price Per Unit',
      'Total Price',
      'Status',
      'Payment Status',
      'Rating',
      'Description'
    ];

    const csvRows = [
      headers.join(','),
      ...requests.map((item) => {
        const productId = item.productId || item.product_id || item.product?.id || item.id || item.requestId || 'N/A';
        const rawName = item.productName || item.product_name || item.product?.name || 'N/A';
        const productName = `"${rawName.replace(/"/g, '""')}"`;
        const quantity = item.quantity || 1;
        const totalPrice = item.totalAmount || item.total_amount || 0;
        const pricePerUnit = item.pricePerUnit || item.price_per_unit || (quantity > 0 ? (totalPrice / quantity) : 0);
        const status = getStatusString(item);
        const paymentStatus = getPaymentStatusString(item);
        const rating = item.rating ? `${item.rating.score}/5` : 'N/A';
        const rawDesc = item.justification || item.description || 'N/A';
        const description = `"${rawDesc.replace(/"/g, '""')}"`;

        return [productId, productName, quantity, pricePerUnit, totalPrice, status, paymentStatus, rating, description].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `procurement-requests-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Logout Handler
  const handleLogout = () => {
    setRequests([]);
    setLoading(true);
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div>
      <header className="glass-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 3rem'
      }}>
        <Logo size={36} textColor="#0F172A" />
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {isAdmin ? (
            <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.35rem 0.85rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
              ADMIN MODE
            </span>
          ) : (
            <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '0.35rem 0.85rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '700', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
              USER MODE
            </span>
          )}
          <button 
            className="btn-3d"
            style={{ padding: '0.5rem 1.25rem', backgroundColor: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
            onClick={handleDownload}
          >
            📥 Download
          </button>
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
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em', color: '#38bdf8', textTransform: 'uppercase' }}>
              ENTERPRISE PROCUREMENT
            </span>
            <h1 style={{ fontSize: '2.4rem', color: '#ffffff', margin: '0.25rem 0', fontWeight: '800' }}>
              Welcome to your Dashboard
            </h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.05rem' }}>
              {isAdmin ? 'Manage and approve procurement requests from users.' : 'Track your procurement requests and monitor their current status.'}
            </p>
          </div>

          <button 
            className={isAdmin ? "" : "btn-3d"}
            onClick={() => !isAdmin && navigate('/raise-request')}
            disabled={isAdmin}
            style={{ 
              padding: '0.85rem 1.75rem', 
              backgroundColor: isAdmin ? '#cbd5e1' : '#0284c7', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '8px', 
              fontSize: '1.05rem', 
              fontWeight: '700', 
              cursor: isAdmin ? 'not-allowed' : 'pointer', 
              opacity: isAdmin ? 0.7 : 1
            }}
          >
            + Raise Request
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="card-3d">
            <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem', display: 'inline-block', padding: '0.5rem', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>📄</div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Requests Raised</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>{totalRaised}</div>
            </div>
          </div>

          <div className="card-3d">
            <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem', display: 'inline-block', padding: '0.5rem', backgroundColor: '#fef3c7', borderRadius: '8px' }}>⌛</div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#d97706', marginTop: '0.25rem' }}>{pendingCount}</div>
            </div>
          </div>

          <div className="card-3d">
            <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem', display: 'inline-block', padding: '0.5rem', backgroundColor: '#dcfce7', borderRadius: '8px' }}>✔️</div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#16a34a', marginTop: '0.25rem' }}>{approvedCount}</div>
            </div>
          </div>

          <div className="card-3d">
            <div style={{ fontSize: '1.4rem', marginBottom: '0.75rem', display: 'inline-block', padding: '0.5rem', backgroundColor: '#fee2e2', borderRadius: '8px' }}>❌</div>
            <div>
              <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rejected</span>
              <div style={{ fontSize: '2rem', fontWeight: '800', color: '#dc2626', marginTop: '0.25rem' }}>{rejectedCount}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
          <div className="panel-3d" style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b', fontSize: '1.25rem' }}>Request Overview</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 0 }}>Current status of your requests</p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', flex: 1, padding: '1rem 0' }}>
              <div style={{
                width: '140px',
                height: '140px',
                borderRadius: '50%',
                background: `conic-gradient(
                  #38bdf8 0% ${totalRaised ? (pendingCount / totalRaised) * 100 : 0}%,
                  #10b981 ${totalRaised ? (pendingCount / totalRaised) * 100 : 0}% ${totalRaised ? ((pendingCount + approvedCount) / totalRaised) * 100 : 0}%,
                  #ef4444 ${totalRaised ? ((pendingCount + approvedCount) / totalRaised) * 100 : 0}% 100%
                )`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                <div style={{ width: '90px', height: '90px', backgroundColor: '#ffffff', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#1e293b' }}>{totalRaised}</span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#38bdf8', borderRadius: '50%', boxShadow: '0 2px 4px rgba(56, 189, 248, 0.4)' }}></span>
                  <span>Pending: <strong>{pendingCount}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '50%', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.4)' }}></span>
                  <span>Approved: <strong>{approvedCount}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: '12px', height: '12px', backgroundColor: '#ef4444', borderRadius: '50%', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)' }}></span>
                  <span>Rejected: <strong>{rejectedCount}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="panel-3d">
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#1e293b', fontSize: '1.25rem' }}>Quick Actions</h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: 0 }}>Manage your procurement activities</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
              <div 
                className={isAdmin ? "" : "btn-3d"}
                onClick={() => !isAdmin && navigate('/raise-request')}
                style={{ 
                  padding: '1rem', 
                  backgroundColor: isAdmin ? '#f8fafc' : '#f1f5f9', 
                  borderRadius: '8px', 
                  cursor: isAdmin ? 'not-allowed' : 'pointer',
                  opacity: isAdmin ? 0.6 : 1,
                  border: '1px solid rgba(0,0,0,0.05)'
                }}
              >
                <strong style={{ color: isAdmin ? '#94a3b8' : '#0284c7', fontSize: '0.95rem', display: 'block' }}>
                  + Raise New Request
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {isAdmin ? 'Restricted to regular users' : 'Create a new procurement request'}
                </span>
              </div>

              <div 
                className="btn-3d"
                onClick={handleDownload}
                style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '8px', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.05)' }}
              >
                <strong style={{ color: '#334155', fontSize: '0.95rem', display: 'block' }}>📥 Download Requests</strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Download your request history</span>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-3d">
          <h3 style={{ margin: '0 0 1.25rem 0', color: '#1e293b', fontSize: '1.25rem' }}>All Requisitions</h3>
          
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: '500', animation: 'pulse 2s infinite' }}>Loading records securely...</p>
            </div>
          ) : requests.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem 0', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>📭</span>
              <p style={{ color: '#64748b', fontWeight: '500' }}>No entries found in procurement_requests table.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '1rem' }}>Request ID</th>
                    <th style={{ padding: '1rem' }}>Justification</th>
                    <th style={{ padding: '1rem' }}>Quantity</th>
                    <th style={{ padding: '1rem' }}>Total Amount</th>
                    <th style={{ padding: '1rem' }}>User ID</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Payment Status</th>
                    <th style={{ padding: '1rem' }}>Rating</th>
                    <th style={{ padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.95rem', color: '#334155' }}>
                  {requests.map((item) => {
                    const reqId = item.requestId || item.request_id || item.id;
                    const amount = item.totalAmount || item.total_amount;
                    const userId = item.user?.userId || item.user?.id || item.userId || item.user_id;
                    const currentStatus = getStatusString(item);
                    const paymentStatus = getPaymentStatusString(item);
                    
                    // Added OUT_OF_STOCK to ensure action buttons get disabled
                    const isFinalized = currentStatus.includes('APPR') || currentStatus.includes('REJE') || currentStatus === 'COMPLETED' || currentStatus === 'DELIVERED' || currentStatus === 'DECLINED' || currentStatus === 'OUT_OF_STOCK';
                    
                    return (
                      <tr key={reqId} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s ease' }} onMouseOver={e => e.currentTarget.style.backgroundColor = '#f8fafc'} onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <td style={{ padding: '1rem', fontWeight: '700', color: '#0f172a' }}>#{reqId}</td>
                        <td style={{ padding: '1rem', fontWeight: '500' }}>{item.justification || 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>{item.quantity || 1}</td>
                        <td style={{ padding: '1rem', fontWeight: '600' }}>{amount ? `₹${amount.toLocaleString('en-IN')}` : 'N/A'}</td>
                        <td style={{ padding: '1rem' }}>{userId ? `User #${userId}` : 'N/A'}</td>
                        
                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            // Added styling for OUT_OF_STOCK
                            backgroundColor: 
                              currentStatus.includes('APPR') || currentStatus === 'DELIVERED' ? '#dcfce7' : 
                              currentStatus.includes('REJE') || currentStatus === 'OUT_OF_STOCK' ? '#fee2e2' : '#fef3c7',
                            color: 
                              currentStatus.includes('APPR') || currentStatus === 'DELIVERED' ? '#166534' : 
                              currentStatus.includes('REJE') || currentStatus === 'OUT_OF_STOCK' ? '#991b1b' : '#92400e',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            {currentStatus}
                          </span>
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <span style={{
                            padding: '0.35rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            backgroundColor: paymentStatus === 'PAID' ? '#dcfce7' : '#fef3c7',
                            color: paymentStatus === 'PAID' ? '#166534' : '#b45309',
                            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
                          }}>
                            {paymentStatus}
                          </span>
                        </td>

                        <td style={{ padding: '1rem' }}>
                          {item.rating ? (
                            <div 
                              title={item.rating.feedback || 'No written feedback provided'} 
                              style={{ cursor: 'help', letterSpacing: '2px', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))' }}
                            >
                              {'⭐'.repeat(item.rating.score)}
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontStyle: 'italic' }}>Unrated</span>
                          )}
                        </td>

                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {isAdmin ? (
                              <>
                                <button
                                  className={isFinalized ? "" : "btn-3d"}
                                  onClick={() => handleApproveAndPay(item)}
                                  disabled={isFinalized}
                                  style={{
                                    padding: '0.4rem 0.8rem',
                                    backgroundColor: isFinalized ? '#cbd5e1' : '#10b981',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    cursor: isFinalized ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  Approve
                                </button>
                                <button
                                  className={isFinalized ? "" : "btn-3d"}
                                  onClick={() => handleReject(reqId)}
                                  disabled={isFinalized}
                                  style={{
                                    padding: '0.4rem 0.8rem',
                                    backgroundColor: isFinalized ? '#cbd5e1' : '#ef4444',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    cursor: isFinalized ? 'not-allowed' : 'pointer'
                                  }}
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              (currentStatus === 'APPROVED' || currentStatus === 'DELIVERED') && !item.rating && paymentStatus === 'PAID' ? (
                                <button
                                  className="btn-3d"
                                  onClick={() => setRatingModalRequest(item)}
                                  style={{
                                    padding: '0.4rem 0.8rem',
                                    backgroundColor: '#3b82f6',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ⭐ Rate Product
                                </button>
                              ) : (
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>No actions</span>
                              )
                            )}
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

        {ratingModalRequest && (
          <ProductRatingModal
            request={ratingModalRequest}
            currentUserId={currentUserId}
            onClose={() => setRatingModalRequest(null)}
            onSuccess={() => {
              setRatingModalRequest(null);
              fetchRequests(); 
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;