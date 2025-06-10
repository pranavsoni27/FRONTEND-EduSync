import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login, register } from '../api';
import { useNavigate } from 'react-router-dom';

const LoginRegister = ({ onLogin }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'student',
        firstName: '',
        lastName: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            console.log('Attempting to:', isLogin ? 'login' : 'register', 'with:', formData);
            
            let response;
            if (isLogin) {
                response = await login(formData.email, formData.password);
            } else {
                response = await register(
                    formData.email,
                    formData.password,
                    formData.role,
                    formData.firstName,
                    formData.lastName
                );
            }

            console.log('Auth response:', response);
            
            if (response && response.token) {
                // Store the token and user info
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify({
                    id: response.id,
                    email: response.email,
                    role: response.role
                }));
                
                // Update auth context
                onLogin({
                    id: response.id,
                    token: response.token,
                    email: response.email,
                    role: response.role
                });

                // Redirect based on role
                if (response.role === 'student') {
                    navigate('/student-dashboard');
                } else if (response.role === 'instructor') {
                    navigate('/instructor-dashboard');
                }
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Auth error:', error);
            setError(error.message || 'An error occurred during authentication');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className="container">
            <div className="row justify-content-center align-items-center min-vh-100">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0 rounded-lg">
                        <div className="card-header bg-success text-white text-center py-4">
                            <h3 className="mb-0">{isLogin ? 'Welcome Back!' : 'Create Account'}</h3>
                        </div>
                        <div className="card-body p-4">
                            <form onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">First Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required={!isLogin}
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Last Name</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required={!isLogin}
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="mb-3">
                                    <label className="form-label">Email address</label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-select"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                    >
                                        <option value="student">Student</option>
                                        <option value="instructor">Instructor</option>
                                    </select>
                                </div>
                                <div className="d-grid">
                                    <button
                                        type="submit"
                                        className="btn btn-dark btn-lg"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        ) : null}
                                        {isLogin ? 'Login' : 'Register'}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="card-footer text-center py-3">
                            <div className="small">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    className="btn btn-link p-0"
                                    onClick={() => setIsLogin(!isLogin)}
                                >
                                    {isLogin ? 'Register here' : 'Login here'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;
