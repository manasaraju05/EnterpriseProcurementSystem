import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    designation: '',
    department: { deptName: '' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'department') {
      setFormData({
        ...formData,
        department: { deptName: value }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    // Transform local state to match RegisterRequest DTO payload
    const payload = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phoneNo: formData.phone,                 // Mapped to phoneNo for backend
      designation: formData.designation,
      department: formData.department.deptName // Plain string department name
    };

    try {
      const response = await fetch('http://localhost:8082/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();

      if (response.ok) {
        setSuccessMessage('Registration successful! Redirecting to login page...');
        setFormData({
          name: '',
          email: '',
          password: '',
          phone: '',
          designation: '',
          department: { deptName: '' }
        });

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Displays exact backend validation errors (e.g. duplicate email)
        try {
          const parsedError = JSON.parse(responseText);
          setErrorMessage(parsedError.message || responseText);
        } catch {
          setErrorMessage(responseText || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrorMessage('Unable to connect to the backend server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Left Panel */}
      <div style={{
        flex: '1.1',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        padding: '4rem 3.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative'
      }}>
        <div>
          <div style={{ marginBottom: '3rem' }}>
            <Logo size={28} textColor="#ffffff" />
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.25, marginBottom: '1.25rem', color: '#ffffff' }}>
            Empower your enterprise with effortless procurement.
          </h1>
          
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '3rem', maxWidth: '480px' }}>
            Connect teams, automate approval chains, and manage purchasing workflows on a single centralized platform.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>⚡</span>
              <div>
                <strong style={{ display: 'block', color: '#ffffff', fontSize: '1rem', marginBottom: '0.2rem' }}>
                  Automated Approvals
                </strong>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Speed up order fulfillments with instant routing.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🎯</span>
              <div>
                <strong style={{ display: 'block', color: '#ffffff', fontSize: '1rem', marginBottom: '0.2rem' }}>
                  Real-Time Visibility
                </strong>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Monitor budget allocations and request status.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🔒</span>
              <div>
                <strong style={{ display: 'block', color: '#ffffff', fontSize: '1rem', marginBottom: '0.2rem' }}>
                  Enterprise Compliance
                </strong>
                <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                  Ensure role-based security & audit readiness.
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>
          © 2026 ProcureFlow Platform
        </div>
      </div>

      {/* Right Panel Canvas */}
      <div style={{
        flex: '1',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 2rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          padding: '2.5rem',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)'
        }}>
          
          <div style={{ marginBottom: '1.75rem' }}>
            <h2 style={{ fontSize: '1.75rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
              Create Account
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.4rem' }}>
              Register for the Enterprise Procurement System
            </p>
          </div>

          {/* Alert Banners */}
          {successMessage && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              ✅ {successMessage}
            </div>
          )}

          {errorMessage && (
            <div style={{ padding: '0.75rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Full Name
              </label>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                required
                value={formData.name}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="Enter your work email"
                required
                value={formData.email}
                onChange={handleChange}
                style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter 10 digit phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Designation
                </label>
                <select
                  name="designation"
                  required
                  value={formData.designation}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select Designation</option>
                  <option value="Manager">Manager</option>
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Procurement Specialist">Procurement Specialist</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                  <option value="Operations Lead">Operations Lead</option>
                  <option value="HR Executive">HR Executive</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                  Department
                </label>
                <select
                  name="department"
                  required
                  value={formData.department.deptName}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.75rem 0.9rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', backgroundColor: '#ffffff', outline: 'none', boxSizing: 'border-box' }}
                >
                  <option value="">Select Department</option>
                  <option value="IT & Software">IT & Software</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{ marginTop: '0.5rem', width: '100%', padding: '0.85rem', borderRadius: '8px', border: 'none', backgroundColor: isLoading ? '#94a3b8' : '#0284c7', color: '#ffffff', fontSize: '1rem', fontWeight: 700, cursor: isLoading ? 'not-allowed' : 'pointer' }}
            >
              {isLoading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '1.5rem', marginBottom: 0 }}>
            Already registered?{' '}
            <span 
              onClick={() => navigate('/login')} 
              style={{ color: '#0284c7', fontWeight: 600, cursor: 'pointer' }}
            >
              Sign in
            </span>
          </p>

        </div>
      </div>

    </div>
  );
}