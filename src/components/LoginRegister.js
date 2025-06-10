import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';

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
    const [authError, setAuthError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);
        setLoading(true);

        try {
            console.log('Attempting to:', isLogin ? 'login' : 'register', 'with:', formData);
            
            let response;
            if (isLogin) {
                response = await login(formData.email, formData.password, formData.role);
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
            setAuthError(error.message || 'An error occurred during authentication');
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

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setAuthError(null);
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
                            {authError && (
                                <div className="alert alert-danger" role="alert">
                                    {authError}
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                {!isLogin && (
                                    <>
                                        <div className="form-floating mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="firstName"
                                                name="firstName"
                                                placeholder="First Name"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                                required={!isLogin}
                                            />
                                            <label htmlFor="firstName">First Name</label>
                                        </div>
                                        <div className="form-floating mb-3">
                                            <input
                                                type="text"
                                                className="form-control"
                                                id="lastName"
                                                name="lastName"
                                                placeholder="Last Name"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                required={!isLogin}
                                            />
                                            <label htmlFor="lastName">Last Name</label>
                                        </div>
                                    </>
                                )}
                                <div className="form-floating mb-3">
                                    <input
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        placeholder="name@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="email">Email address</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        placeholder="Password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                    <label htmlFor="password">Password</label>
                                </div>
                                <div className="form-floating mb-3">
                                    <select
                                        className="form-select"
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="student">Student</option>
                                        <option value="instructor">Instructor</option>
                                    </select>
                                    <label htmlFor="role">Role</label>
                                </div>
                                <div className="d-grid">
                                    <button
                                        className="btn btn-success btn-lg"
                                        type="submit"
                                        disabled={loading}
                                    >
                                        {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
                                    </button>
                                </div>
                            </form>
                        </div>
                        <div className="card-footer text-center py-3">
                            <div className="small">
                                {isLogin ? "Don't have an account? " : "Already have an account? "}
                                <button
                                    className="btn btn-link p-0"
                                    onClick={toggleMode}
                                    type="button"
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
