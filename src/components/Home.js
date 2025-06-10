import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div>
            <div className="bg-success text-white py-5">
                <div className="container mt-4">
                    <div className="row align-items-center">
                        <div className="col-lg-6">
                            <h1 className="display-4 fw-bold mb-4">Welcome to EduSync</h1>
                            <p className="lead mb-5">
                                Your comprehensive learning management system for seamless education delivery
                                and student engagement.
                            </p>
                            <Link to="/login" className="btn btn-light btn-lg">
                                Get Started
                            </Link>
                        </div>
                        <div className="col-lg-6 mb-4">
                            <img 
                                src="https://img.freepik.com/free-vector/online-learning-isometric-concept_1284-17947.jpg" 
                                alt="Education" 
                                className="img-fluid rounded shadow-lg"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="container py-5">
                <h2 className="text-center mb-5">Key Features</h2>
                <div className="row g-4">
                    <div className="col-md-4">
                        <div className="card h-100 border-0 shadow-sm">
                            <div className="card-body text-center p-4">
                                <i className="fas fa-book fa-3x text-success mb-3"></i>
                                <h3 className="h5 mb-3">Course Management</h3>
                                <p className="text-muted">
                                    Create, manage, and deliver courses with ease. Upload materials and track progress.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100 border-0 shadow-sm">
                            <div className="card-body text-center p-4">
                                <i className="fas fa-tasks fa-3x text-success mb-3"></i>
                                <h3 className="h5 mb-3">Assessments</h3>
                                <p className="text-muted">
                                    Create and manage assessments. Track student performance and provide feedback.
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="card h-100 border-0 shadow-sm">
                            <div className="card-body text-center p-4">
                                <i className="fas fa-chart-line fa-3x text-success mb-3"></i>
                                <h3 className="h5 mb-3">Progress Tracking</h3>
                                <p className="text-muted">
                                    Monitor student progress, generate reports, and identify areas for improvement.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-light py-5">
                <div className="container text-center">
                    <h2 className="mb-4">Ready to Get Started?</h2>
                    <p className="lead mb-4">
                        Join our platform today and experience the future of education.
                    </p>
                    <Link to="/login" className="btn btn-dark btn-lg">
                        Sign Up Now
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Home; 