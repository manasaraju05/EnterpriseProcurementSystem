import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const ADMIN_EMAILS = [
    'divyashreeraju21@gmail.com'
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();
    const isAdminUser = ADMIN_EMAILS.includes(cleanEmail);
    const assignedRole = isAdminUser ? 'ADMIN' : 'USER';

    try {
      const response = await fetch('http://localhost:8082/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.clear();
        sessionStorage.clear();

        const serverRole = (data.role || '').toUpperCase();
        const supplierId = data.supplierId || data.supplier?.supplierId || data.id;
        const isSupplier = serverRole === 'SUPPLIER' || !!data.supplierId || !!data.supplier;

        localStorage.setItem('token', data.token || 'mock-jwt-token');
        localStorage.setItem('role', isSupplier ? 'SUPPLIER' : assignedRole);
        localStorage.setItem('isAdmin', isAdminUser && !isSupplier ? 'true' : 'false');

        if (isSupplier) {
          localStorage.setItem('supplierId', supplierId);
          localStorage.setItem('user', JSON.stringify({ ...data, email: cleanEmail, role: 'SUPPLIER', supplierId }));
          alert('Login Successful! Logged in as: SUPPLIER');
          navigate('/supplier-dashboard');
        } else {
          localStorage.setItem('userId', data.userId || (isAdminUser ? '2' : '20'));
          localStorage.setItem('user', JSON.stringify({ ...data, email: cleanEmail, role: assignedRole }));
          alert(`Login Successful! Logged in as: ${assignedRole}`);
          navigate('/dashboard');
        }
      } else {
        const errorMsg = await response.text();
        alert(`Login failed: ${errorMsg || 'Invalid credentials'}`);
      }
    } catch (error) {
      console.error('Backend connection error:', error);
      
      localStorage.clear();
      sessionStorage.clear();

      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('userId', isAdminUser ? '2' : '20');
      localStorage.setItem('role', assignedRole);
      localStorage.setItem('isAdmin', isAdminUser ? 'true' : 'false');
      localStorage.setItem('user', JSON.stringify({ id: isAdminUser ? 2 : 20, email: cleanEmail, role: assignedRole }));

      alert(`Logged in via Fallback Mode! Role: ${assignedRole}`);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* panel-3d provides the frosted glass container effect */}
      <div className="panel-3d" style={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Logo size={42} textColor="#0F172A" />
        </div>
        <p style={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn-3d" style={styles.button}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.registerText}>
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')} style={styles.registerLink}>
            Create account
          </span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' },
  card: { backgroundColor: '#ffffff', width: '100%', maxWidth: '400px', boxSizing: 'border-box' },
  subtitle: { margin: '0 0 1.5rem 0', fontSize: '0.9rem', color: '#64748b', textAlign: 'center' },
  formGroup: { marginBottom: '1.25rem' },
  label: { display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#334155', marginBottom: '0.5rem' },
  input: { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' },
  button: { width: '100%', padding: '0.75rem', backgroundColor: '#0284c7', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: '0.5rem' },
  registerText: { textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '1.5rem', marginBottom: 0 },
  registerLink: { color: '#0284c7', fontWeight: '600', cursor: 'pointer' }
};

export default Login;