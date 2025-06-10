import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

import Navbar from './components/Navbar';
import Home from './components/Home';
import LoginRegister from './components/LoginRegister';
import StudentDashboard from './components/StudentDashboard';
import InstructorDashboard from './components/InstructorDashboard';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    const handleLogin = (userData) => {
        console.log('Login data received:', { ...userData, token: '***' });
        if (!userData.token) {
            console.error('No token in user data');
            return;
        }
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('user');
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <BrowserRouter>
            <div className="min-vh-100 d-flex flex-column">
                <Navbar user={user} onLogout={handleLogout} />
                <main className="flex-grow-1">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route
                            path="/login"
                            element={
                                user ? (
                                    <Navigate to={user.role === 'student' ? '/student/dashboard' : '/instructor/dashboard'} replace />
                                ) : (
                                    <LoginRegister onLogin={handleLogin} />
                                )
                            }
                        />
                        {/* Student Routes */}
                        <Route
                            path="/student/dashboard"
                            element={
                                user?.role === 'student' ? (
                                    <StudentDashboard user={user} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/student/courses"
                            element={
                                user?.role === 'student' ? (
                                    <StudentDashboard user={user} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/student/assessments"
                            element={
                                user?.role === 'student' ? (
                                    <StudentDashboard user={user} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        {/* Instructor Routes */}
                        <Route
                            path="/instructor/dashboard"
                            element={
                                user?.role === 'instructor' ? (
                                    <InstructorDashboard user={user} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/instructor/courses"
                            element={
                                user?.role === 'instructor' ? (
                                    <InstructorDashboard user={user} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/instructor/assessments"
                            element={
                                user?.role === 'instructor' ? (
                                    <InstructorDashboard user={user} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route
                            path="/instructor/student-progress"
                            element={
                                user?.role === 'instructor' ? (
                                    <InstructorDashboard user={user} />
                                ) : (
                                    <Navigate to="/login" replace />
                                )
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </main>
            </div>
            <ToastContainer position="top-right" />
        </BrowserRouter>
    );
}

export default App;