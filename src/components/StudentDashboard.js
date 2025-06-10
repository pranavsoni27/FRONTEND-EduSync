import React, { useEffect, useState } from 'react';
import {
    getCourses,
    joinCourse,
    getJoinedCourses,
    getCourseAssessments,
    getUserResults,
    getCourseContents,
    startAssessment,
    submitAssessment
} from '../api';
import { toast } from 'react-toastify';

const FALLBACK_IMAGE = process.env.PUBLIC_URL + '/fallback.png';

const StudentDashboard = ({ user }) => {
    const [allCourses, setAllCourses] = useState([]);
    const [joinedCourses, setJoinedCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [courseContents, setCourseContents] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCourse, setLoadingCourse] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [currentAssessment, setCurrentAssessment] = useState(null);
    const [showAssessmentModal, setShowAssessmentModal] = useState(false);
    const [timerActive, setTimerActive] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.id || !user?.token) {
                console.error('User data:', user);
                toast.error('User information is missing');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                console.log('Fetching data for user:', user.id);
                const [coursesData, joinedData, resultsData] = await Promise.all([
                    getCourses(user.token),
                    getJoinedCourses(user.id, user.token),
                    getUserResults(user.id, user.token)
                ]);
                setAllCourses(coursesData);
                setJoinedCourses(joinedData);
                setResults(resultsData);
            } catch (error) {
                console.error('Error loading dashboard:', error);
                toast.error(error.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        let timer;
        if (timeLeft !== null && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        handleSubmitAssessment();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [timeLeft]);

    const handleJoin = async (courseId) => {
        if (!user?.token) {
            toast.error('Authentication required');
            return;
        }

        try {
            await joinCourse(courseId, user.token);
            const updatedJoinedCourses = await getJoinedCourses(user.id, user.token);
            setJoinedCourses(updatedJoinedCourses);
            toast.success('Successfully joined the course');
        } catch (error) {
            toast.error('Failed to join course');
            console.error('Error joining course:', error);
        }
    };

    const handleViewCourse = async (course) => {
        if (!user?.token) {
            toast.error('Authentication required');
            return;
        }

        try {
            setSelectedCourse(course);
            setLoadingCourse(true);
            console.log('Loading course data for:', course.id);
            const [contentsData, assessmentsData, resultsData] = await Promise.all([
                getCourseContents(course.id, user.token),
                getCourseAssessments(course.id, user.token),
                getUserResults(user.id, user.token)
            ]);
            console.log('Loaded Assessments:', assessmentsData);
            console.log('Loaded Results:', resultsData);
            setCourseContents(contentsData);
            setAssessments(assessmentsData);
            setResults(resultsData);
        } catch (error) {
            toast.error('Failed to load course details');
            console.error('Error loading course details:', error);
        } finally {
            setLoadingCourse(false);
        }
    };

    const handleStartAssessment = async (assessment) => {
        if (!user?.token) {
            console.error('No token available in user object:', user);
            toast.error('Authentication required');
            return;
        }

        const isCompleted = results.some(r => {
            const matches = r.assessmentId === assessment.assessmentId;
            console.log('Checking completion status:', {
                resultAssessmentId: r.assessmentId,
                currentAssessmentId: assessment.assessmentId,
                matches
            });
            return matches;
        });

        if (isCompleted) {
            console.log('Assessment already completed:', {
                assessmentId: assessment.assessmentId,
                results: results
            });
            toast.error('You have already completed this assessment');
            return;
        }

        try {
            console.log('Starting assessment:', assessment);
            console.log('User object:', { ...user, token: user.token.substring(0, 10) + '...' });
            const assessmentData = await startAssessment(assessment.assessmentId, user.token);
            
            if (!assessmentData) {
                throw new Error('No assessment data received');
            }

            if (!assessmentData.questions || assessmentData.questions.length === 0) {
                throw new Error('Assessment has no questions');
            }
            
            const questionsWithIds = assessmentData.questions.map((q, index) => ({
                ...q,
                questionId: q.questionId || `q_${assessment.assessmentId}_${index}`
            }));
            
            console.log('Assessment data received:', { ...assessmentData, questions: questionsWithIds });
            setCurrentAssessment({ ...assessmentData, questions: questionsWithIds });
            setShowAssessmentModal(true);
            setTimeLeft(assessmentData.duration * 60); 
            setTimerActive(true);
            setAnswers({}); 
            setError(null);
        } catch (error) {
            console.error('Error starting assessment:', error);
            const errorMessage = error.message || 'Failed to start assessment';
            toast.error(errorMessage);
            setError(errorMessage);
            setShowAssessmentModal(false);
            setCurrentAssessment(null);
            setTimeLeft(null);
            setTimerActive(false);
        }
    };

    const handleSubmitAssessment = async () => {
        if (!user?.token) {
            toast.error('Authentication required');
            return;
        }

        if (!currentAssessment) {
            toast.error('No assessment selected');
            return;
        }

        try {
            const result = await submitAssessment(currentAssessment.assessmentId, answers, user.token);
            
            toast.success(`Assessment submitted successfully! Your score: ${result.score}/${result.maxScore}`);
            
            setCurrentAssessment(null);
            setTimeLeft(null);
            setAnswers({});
            setShowAssessmentModal(false);
            
            if (selectedCourse) {
                console.log('Refreshing data after submission...');
                const [assessmentsData, resultsData] = await Promise.all([
                    getCourseAssessments(selectedCourse.id, user.token),
                    getUserResults(user.id, user.token)
                ]);
                console.log('New Assessments Data:', assessmentsData);
                console.log('New Results Data:', resultsData);
                setAssessments(assessmentsData);
                setResults(resultsData);
            }
        } catch (error) {
            toast.error('Failed to submit assessment');
            console.error('Error submitting assessment:', error);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const isJoined = (courseId) => joinedCourses.some(c => c.id === courseId);

    console.log('Selected Course ID:', selectedCourse?.id);
    console.log('All Results:', JSON.stringify(results, null, 2));
    console.log('All Assessments:', JSON.stringify(assessments, null, 2));

    if (results.length > 0) {
        console.log('First result date fields:', {
            submittedAt: results[0].submittedAt,
            attemptDate: results[0].attemptDate,
            allFields: Object.keys(results[0])
        });
    }

    const liveAssessments = assessments.filter(a => {
        const isCompleted = results.some(r => {
            const matches = r.assessmentId === a.assessmentId;
            console.log(`Checking result:`, {
                resultAssessmentId: r.assessmentId,
                currentAssessmentId: a.assessmentId,
                matches
            });
            return matches;
        });
        const isForCurrentCourse = a.courseId === selectedCourse?.id;
        console.log(`Assessment ${a.assessmentId}: isCompleted=${isCompleted}, isForCurrentCourse=${isForCurrentCourse}`);
        return !isCompleted && isForCurrentCourse;
    });
    
    const completedAssessments = assessments.filter(a => {
        const isCompleted = results.some(r => {
            const matches = r.assessmentId === a.assessmentId;
            console.log(`Checking completed result:`, {
                resultAssessmentId: r.assessmentId,
                currentAssessmentId: a.assessmentId,
                matches
            });
            return matches;
        });
        const isForCurrentCourse = a.courseId === selectedCourse?.id;
        console.log(`Completed Assessment ${a.assessmentId}: isCompleted=${isCompleted}, isForCurrentCourse=${isForCurrentCourse}`);
        return isCompleted && isForCurrentCourse;
    });

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <h2 className='text-success'>Available Courses</h2>
            <div className="row">
                {allCourses.map((course) => (
                    <div className="col-md-6 mb-3" key={course.id}>
                        <div className="card">
                            <img
                                src={course.mediaUrl || FALLBACK_IMAGE}
                                className="card-img-top img-fluid"
                                alt={course.title}
                                style={{ maxHeight: '180px', width: '100%', objectFit: 'contain', background: '#f8f9fa' }}
                                onError={e => {
                                    e.target.onerror = null;
                                    e.target.src = FALLBACK_IMAGE;
                                }}
                            />
                            <div className="card-body">
                                <h5 className="card-title">{course.title}</h5>
                                <p className="card-text">{course.description}</p>
                                <button
                                    className="btn btn-dark me-2"
                                    onClick={() => handleJoin(course.id)}
                                    disabled={isJoined(course.id)}
                                >
                                    {isJoined(course.id) ? 'Joined' : 'Join'}
                                </button>
                                {isJoined(course.id) && (
                                    <button
                                        className="btn btn-outline-success"
                                        onClick={() => handleViewCourse(course)}
                                    >
                                        View Course
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {selectedCourse && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {selectedCourse.title}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setSelectedCourse(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <p>{selectedCourse.description}</p>
                                
                                {loadingCourse ? (
                                    <div className="d-flex justify-content-center">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <h6 className="mt-4">Course Contents</h6>
                                        {courseContents.length === 0 ? (
                                            <p>No contents available.</p>
                                        ) : (
                                            <div className="list-group">
                                                {courseContents.map(content => (
                                                    <div key={content.id} className="list-group-item">
                                                        <h6>{content.title}</h6>
                                                        <p>{content.description}</p>
                                                        {content.type === 'video' && (
                                                            <video controls className="w-100">
                                                                <source src={content.url} type="video/mp4" />
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        )}
                                                        {content.type === 'document' && (
                                                            <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-success">
                                                                View Document
                                                            </a>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <h6 className="mt-4">Live Assessments</h6>
                                        {liveAssessments.length === 0 ? (
                                            <p>No live assessments available.</p>
                                        ) : (
                                            <div className="list-group">
                                                {liveAssessments.map(assessment => (
                                                    <div key={assessment.assessmentId} className="list-group-item">
                                                        <h6>{assessment.title}</h6>
                                                        <button
                                                            className="btn btn-danger"
                                                            onClick={() => handleStartAssessment(assessment)}
                                                        >
                                                            Start Assessment
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <h6 className="mt-4">Completed Assessments</h6>
                                        {completedAssessments.length === 0 ? (
                                            <p>No completed assessments.</p>
                                        ) : (
                                            <div className="list-group">
                                                {completedAssessments.map(assessment => {
                                                    const result = results.find(r => r.assessmentId === assessment.assessmentId);
                                                    return (
                                                        <div key={assessment.assessmentId} className="list-group-item">
                                                            <div className="d-flex justify-content-between align-items-center">
                                                                <div>
                                                                    <h6 className="mb-1">{assessment.title}</h6>
                                                                    {/* <p className="mb-1 text-muted">
                                                                        Duration: {assessment.duration || 30} minutes
                                                                    </p> */}
                                                                </div>
                                                                {result && (
                                                                    <div className="text-end">
                                                                        <h5 className="mb-1">
                                                                            Score: <span className="text-success">{result.score}</span> / {assessment.maxScore}
                                                                        </h5>
                                                                        <small className="text-muted">
                                                                            {console.log('Result submission time:', {
                                                                                raw: result.submittedAt,
                                                                                parsed: result.submittedAt ? new Date(result.submittedAt) : null,
                                                                                formatted: result.submittedAt ? new Date(result.submittedAt).toLocaleString('en-IN', {
                                                                                    timeZone: 'Asia/Kolkata',
                                                                                    year: 'numeric',
                                                                                    month: 'short',
                                                                                    day: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                }) : 'Recently'
                                                                            })}
                                                                            Submitted: {result.submittedAt ? new Date(result.submittedAt).toLocaleString('en-IN', {
                                                                                timeZone: 'Asia/Kolkata',
                                                                                year: 'numeric',
                                                                                month: 'short',
                                                                                day: 'numeric',
                                                                                hour: '2-digit',
                                                                                minute: '2-digit',
                                                                                hour12: true
                                                                            }) : 'Recently'}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-dark"
                                    onClick={() => setSelectedCourse(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showAssessmentModal && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{currentAssessment.title}</h5>
                                <div className="ms-auto">
                                    Time Left: <span className='text-danger'> {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} </span>
                                </div>
                            </div>
                            <div className="modal-body">
                                {currentAssessment.questions.map((question, index) => (
                                    <div key={`question_${question.questionId}`} className="mb-4">
                                        <h6>Question {index + 1}</h6>
                                        <p>{question.text}</p>
                                        <div className="list-group">
                                            {question.options.map((option, optionIndex) => (
                                                <label 
                                                    key={`option_${question.questionId}_${optionIndex}`} 
                                                    className="list-group-item"
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${question.questionId}`}
                                                        value={optionIndex}
                                                        checked={answers[question.questionId] === optionIndex}
                                                        onChange={() => handleAnswerChange(question.questionId, optionIndex)}
                                                        className="me-2"
                                                    />
                                                    {option}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-success"
                                    onClick={handleSubmitAssessment}
                                >
                                    Submit Assessment
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
