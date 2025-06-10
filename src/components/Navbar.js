import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        toast.success("LogOut Done");
        navigate('/');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container">
                <Link className="navbar-brand" to="/">EduSync</Link>
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarNav">
                    {user ? (
                        <>
                            <ul className="navbar-nav me-auto">
                                {user.role === 'student' ? (
                                    <>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/student/dashboard">Dashboard</Link>
                                        </li>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/student/courses">My Courses</Link>
                                        </li>
                                    </>
                                ) : (
                                    <>
                                        <li className="nav-item">
                                            <Link className="nav-link" to="/instructor/dashboard">Dashboard</Link>
                                        </li>
                                    </>
                                )}
                            </ul>
                            <div className="d-flex align-items-center">
                                <span className="text-white me-3">
                                    {user.role === 'student' ? 'Student' : 'Instructor'}: {user.email}
                                </span>
                                <button 
                                    className="btn btn-outline-light" 
                                    onClick={handleLogout}
                                >
                                    Logout
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="ms-auto">
                            <Link to="/login" className="btn btn-outline-light">
                                Login / Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 