import React, { useEffect, useState } from 'react';
import { getCourses, uploadCourse, uploadCourseContent, uploadAssessment, getStudentPerformance } from '../api';
import { toast, Toaster } from 'react-hot-toast';

const FALLBACK_IMAGE = 'https://via.placeholder.com/100x60';

const InstructorDashboard = ({ user }) => {
    const [courses, setCourses] = useState([]);
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showAssessmentModal, setShowAssessmentModal] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showCourseDetails, setShowCourseDetails] = useState(false);

    const [courseImage, setCourseImage] = useState('');
    const [courseName, setCourseName] = useState('');
    const [courseDescription, setCourseDescription] = useState('');

    const [assessmentName, setAssessmentName] = useState('');
    const [assessmentDuration, setAssessmentDuration] = useState('');
    const [numQuestions, setNumQuestions] = useState(0);
    const [questions, setQuestions] = useState([]);

    const [showContentModal, setShowContentModal] = useState(false);
    const [contentUrl, setContentUrl] = useState('');
    const [contentTitle, setContentTitle] = useState('');
    const [contentDescription, setContentDescription] = useState('');

    const [studentPerformance, setStudentPerformance] = useState([]);
    const [loadingPerformance, setLoadingPerformance] = useState(false);

    useEffect(() => {
        getCourses(user.token).then(setCourses);
    }, [user.token]);

    const openCourseModal = () => {
        setCourseImage('');
        setCourseName('');
        setCourseDescription('');
        setShowCourseModal(true);
    };

    const openAssessmentModal = (course) => {
        setSelectedCourse(course);
        setAssessmentName('');
        setAssessmentDuration('');
        setNumQuestions(0);
        setQuestions([]);
        setShowAssessmentModal(true);
    };

    const handleCourseSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            title: courseName,
            description: courseDescription,
            instructorId: user.id,
            mediaUrl: courseImage
        };
        try {
            await uploadCourse(payload, user.token);
            setShowCourseModal(false);
            getCourses(user.token).then(setCourses);
        } catch (err) {
            alert(err.message || 'Failed to upload course');
        }
    };

    const handleContentSubmit = async (e) => {
        e.preventDefault();
        try {
            await uploadCourseContent(selectedCourse.id, {
                url: contentUrl,
                title: contentTitle,
                description: contentDescription,
                type: 'document'
            }, user.token);
            setShowContentModal(false);
            setContentUrl('');
            setContentTitle('');
            setContentDescription('');
            toast.success('Content uploaded successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to upload content');
        }
    };

    const openContentModal = (course) => {
        setSelectedCourse(course);
        setContentUrl('');
        setContentTitle('');
        setContentDescription('');
        setShowContentModal(true);
        setShowCourseDetails(false);
    };

    const openCourseDetails = (course) => {
        setSelectedCourse(course);
        setShowCourseDetails(true);
        setShowContentModal(false);
    };

    const handleAssessmentSubmit = async (e) => {
        e.preventDefault();
        if (numQuestions === 0) {
            toast.error('Please add at least one question');
            return;
        }
        try {
            const payload = {
                title: assessmentName,
                duration: parseInt(assessmentDuration),
                questions: questions.map(q => ({
                    text: q.text,
                    options: q.options,
                    correctOptionIndex: q.correct,
                    marks: q.marks
                }))
            };

            await uploadAssessment({
                courseId: selectedCourse.id,
                ...payload
            }, user.token);
            setShowAssessmentModal(false);
            toast.success('Assessment created successfully');
        } catch (error) {
            toast.error(error.message || 'Failed to create assessment');
        }
    };

    const handleViewStudentPerformance = async (course) => {
        if (!user?.token) {
            toast.error('Authentication required');
            return;
        }

        try {
            setSelectedCourse(course);
            setShowCourseDetails(true);
            setLoadingPerformance(true);
            const performanceData = await getStudentPerformance(course.id, user.token);
            setStudentPerformance(performanceData);
        } catch (error) {
            toast.error('Failed to load student performance');
            console.error('Error loading student performance:', error);
        } finally {
            setLoadingPerformance(false);
        }
    };

    return (
        <div className="container mt-4">
            <Toaster position="top-right" />
            <h2 className="mb-4">Instructor Dashboard</h2>
            <button className="btn btn-success mb-4" onClick={openCourseModal}>
                <i className="bi bi-plus-circle"></i> + Upload New Course
            </button>
            <div className="row">
                {courses.map((course) => (
                    <div className="col-md-6 mb-4" key={course.id}>
                        <div className="card h-100">
                            <img
                                src={course.mediaUrl || FALLBACK_IMAGE}
                                className="card-img-top img-fluid"
                                alt={course.title}
                                style={{ maxHeight: '180px', objectFit: 'contain', background: '#f8f9fa' }}
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = FALLBACK_IMAGE;
                                }}
                            />
                            <div className="card-body">
                                <h5 className="card-title">{course.title}</h5>
                                <button 
                                    className="btn btn-warning me-2" 
                                    onClick={() => openContentModal(course)}
                                >
                                    Upload Content
                                </button>
                                <button 
                                    className="btn btn-info me-2" 
                                    onClick={() => openAssessmentModal(course)}
                                >
                                    Create Assessment
                                </button>
                                <button 
                                    className="btn btn-dark me-2"
                                    onClick={() => handleViewStudentPerformance(course)}
                                >
                                    Student Performance
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showCourseModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <form className="modal-content" onSubmit={handleCourseSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">Upload New Course</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCourseModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Course Image URL</label>
                                    <input type="url" className="form-control" value={courseImage} onChange={e => setCourseImage(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Course Name</label>
                                    <input type="text" className="form-control" value={courseName} onChange={e => setCourseName(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <textarea className="form-control" value={courseDescription} onChange={e => setCourseDescription(e.target.value)} required />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCourseModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-success">Upload Course</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showContentModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <form className="modal-content" onSubmit={handleContentSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">Upload Course Content</h5>
                                <button type="button" className="btn-close" onClick={() => setShowContentModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Content Title</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={contentTitle} 
                                        onChange={e => setContentTitle(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Content Description</label>
                                    <textarea 
                                        className="form-control" 
                                        value={contentDescription} 
                                        onChange={e => setContentDescription(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">PDF URL</label>
                                    <input 
                                        type="url" 
                                        className="form-control" 
                                        value={contentUrl} 
                                        onChange={e => setContentUrl(e.target.value)} 
                                        required 
                                        placeholder="Enter the URL of your PDF document"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowContentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-warning">Upload Content</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAssessmentModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <form className="modal-content" onSubmit={handleAssessmentSubmit}>
                            <div className="modal-header">
                                <h5 className="modal-title">Create Assessment</h5>
                                <button type="button" className="btn-close" onClick={() => setShowAssessmentModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Assessment Title</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        value={assessmentName} 
                                        onChange={e => setAssessmentName(e.target.value)} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Duration (minutes)</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={assessmentDuration} 
                                        onChange={e => setAssessmentDuration(e.target.value)} 
                                        required 
                                        min="1"
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Number of Questions</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={numQuestions} 
                                        onChange={e => {
                                            const value = e.target.value;
                                            if (value === '') {
                                                setNumQuestions(0);
                                                setQuestions([]);
                                                return;
                                            }
                                            const newNum = Math.max(0, Math.min(100, parseInt(value) || 0));
                                            setNumQuestions(newNum);
                                            
                                            if (newNum > questions.length) {
                                                const newQuestions = [...questions];
                                                for (let i = questions.length; i < newNum; i++) {
                                                    newQuestions.push({
                                                        text: '',
                                                        options: ['', '', '', ''],
                                                        correct: 0,
                                                        marks: 1
                                                    });
                                                }
                                                setQuestions(newQuestions);
                                            } else if (newNum < questions.length) {
                                                // Remove questions if decreasing
                                                setQuestions(questions.slice(0, newNum));
                                            }
                                        }} 
                                        min="0"
                                        max="100"
                                    />
                                </div>
                                {numQuestions > 0 && questions.map((question, index) => (
                                    <div key={index} className="card mb-3">
                                        <div className="card-body">
                                            <h6>Question {index + 1}</h6>
                                            <div className="mb-3">
                                                <label className="form-label">Question Text</label>
                                                <input 
                                                    type="text" 
                                                    className="form-control" 
                                                    value={question.text} 
                                                    onChange={e => {
                                                        const newQuestions = [...questions];
                                                        newQuestions[index].text = e.target.value;
                                                        setQuestions(newQuestions);
                                                    }} 
                                                    required 
                                                />
                                            </div>
                                            <div className="mb-3">
                                                <label className="form-label">Marks</label>
                                                <input 
                                                    type="number" 
                                                    className="form-control" 
                                                    value={question.marks} 
                                                    onChange={e => {
                                                        const newQuestions = [...questions];
                                                        newQuestions[index].marks = parseInt(e.target.value);
                                                        setQuestions(newQuestions);
                                                    }} 
                                                    required 
                                                    min="1"
                                                />
                                            </div>
                                            {question.options.map((option, optIndex) => (
                                                <div key={optIndex} className="mb-2">
                                                    <div className="input-group">
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            value={option} 
                                                            onChange={e => {
                                                                const newQuestions = [...questions];
                                                                newQuestions[index].options[optIndex] = e.target.value;
                                                                setQuestions(newQuestions);
                                                            }} 
                                                            placeholder={`Option ${optIndex + 1}`}
                                                            required 
                                                        />
                                                        <div className="input-group-text">
                                                            <input 
                                                                type="radio" 
                                                                name={`correct-${index}`} 
                                                                checked={question.correct === optIndex} 
                                                                onChange={() => {
                                                                    const newQuestions = [...questions];
                                                                    newQuestions[index].correct = optIndex;
                                                                    setQuestions(newQuestions);
                                                                }} 
                                                            />
                                                            <label className="ms-2 mb-0">Correct</label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAssessmentModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-info">Create Assessment</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showCourseDetails && selectedCourse && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Student Performance - {selectedCourse.title}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCourseDetails(false)}></button>
                            </div>
                            <div className="modal-body">
                                {loadingPerformance ? (
                                    <div className="d-flex justify-content-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : studentPerformance.length === 0 ? (
                                    <p>No student performance data available.</p>
                                ) : (
                                    <div className="list-group">
                                        {studentPerformance.map(student => (
                                            <div key={student.userId} className="list-group-item">
                                                <h6>{student.userName}</h6>
                                                <p className="text-muted mb-2">{student.email}</p>
                                                {student.assessmentResults.length > 0 && (
                                                    <div className="mt-3">
                                                        <h6>Assessment Results:</h6>
                                                        <div className="table-responsive">
                                                            <table className="table table-sm">
                                                                <thead>
                                                                    <tr>
                                                                        <th>Assessment</th>
                                                                        <th>Score</th>
                                                                        <th>Submitted</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {student.assessmentResults.map(result => (
                                                                        <tr key={result.assessmentId}>
                                                                            <td>{result.assessmentTitle}</td>
                                                                            <td>
                                                                                {result.score} / {result.maxScore}
                                                                            </td>
                                                                            <td>
                                                                                {new Date(result.submittedAt).toLocaleString('en-IN', {
                                                                                    timeZone: 'Asia/Kolkata',
                                                                                    year: 'numeric',
                                                                                    month: 'short',
                                                                                    day: 'numeric'
                                                                                })}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-dark" onClick={() => setShowCourseDetails(false)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InstructorDashboard;
