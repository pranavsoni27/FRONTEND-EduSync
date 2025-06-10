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

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {isLogin ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {authError && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">
                                {authError}
                            </div>
                        </div>
                    )}
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
                <div className="text-center">
                    <button
                        className="btn btn-link p-0"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? 'Register here' : 'Login here'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginRegister;
