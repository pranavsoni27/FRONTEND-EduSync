// const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5008/api';
const API_BASE = process.env.REACT_APP_API_URL || 'https://pranavwebapp1-ebcdg5gjbzfrbvh8.centralindia-01.azurewebsites.net/api';

// Common headers for all requests
const getHeaders = (token = null) => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
};

const handleResponse = async (response, endpoint) => {
    console.log(`Response from ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
        let errorMessage;
        try {
            const data = await response.json();
            console.error(`Error response from ${endpoint}:`, data);
            if (data.errors && Array.isArray(data.errors)) {
                errorMessage = data.errors.join(', ');
            } else {
                errorMessage = data.message || 'An error occurred';
            }
        } catch (e) {
            console.error(`Error parsing response from ${endpoint}:`, e);
            if (e.name === 'TypeError' && e.message === 'Failed to fetch') {
                errorMessage = 'Network error: Unable to reach the server. Please check your internet connection or try again later.';
            } else {
                errorMessage = `Server error: ${response.status} - ${response.statusText}`;
            }
        }
        throw new Error(errorMessage);
    }
    return response.json();
};

export const uploadCourse = async (course, token) => {
    const res = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: getHeaders(token),
        credentials: 'include',
        body: JSON.stringify(course),
    });
    return handleResponse(res, '/courses');
};

export const login = async (email, password, role) => {
    try {
        const loginData = { email, password, role };
        console.log('Login attempt with data:', { email, role });
        const endpoint = '/auth/login';
        console.log('Making request to:', `${API_BASE}${endpoint}`);

        // First, make an OPTIONS request to check CORS
        try {
            const preflightResponse = await fetch(`${API_BASE}${endpoint}`, {
                method: 'OPTIONS',
                headers: getHeaders(),
                mode: 'cors',
                credentials: 'include'
            });
            console.log('Preflight response:', {
                status: preflightResponse.status,
                headers: Object.fromEntries(preflightResponse.headers.entries())
            });
        } catch (preflightError) {
            console.warn('Preflight request failed:', preflightError);
        }
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify(loginData)
        });

        const data = await handleResponse(response, endpoint);
        console.log('Login successful, received data:', { 
            hasToken: !!data.token, 
            hasId: !!data.id,
            role: data.role 
        });

        if (!data.token || !data.id) {
            throw new Error('Server response missing required data');
        }

        return {
            token: data.token,
            id: data.id,
            email: data.email,
            role: data.role
        };
    } catch (error) {
        console.error('Login error details:', error);
        throw error;
    }
};

export const register = async (email, password, role) => {
    try {
        console.log('Attempting to register with:', { email, role });
        const endpoint = '/auth/register';
        console.log('Making request to:', `${API_BASE}${endpoint}`);
        
        // First, make an OPTIONS request to check CORS
        try {
            const preflightResponse = await fetch(`${API_BASE}${endpoint}`, {
                method: 'OPTIONS',
                headers: getHeaders(),
                mode: 'cors',
                credentials: 'include'
            });
            console.log('Preflight response:', {
                status: preflightResponse.status,
                headers: Object.fromEntries(preflightResponse.headers.entries())
            });
        } catch (preflightError) {
            console.warn('Preflight request failed:', preflightError);
        }

        // Then make the actual request
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: getHeaders(),
            mode: 'cors',
            credentials: 'include',
            body: JSON.stringify({ email, password, role }),
        });

        const data = await handleResponse(response, endpoint);
        console.log('Registration successful:', { 
            hasToken: !!data.token, 
            hasId: !!data.id,
            role: data.role 
        });

        if (!data.token || !data.id) {
            throw new Error('Server response missing required data');
        }

        return {
            token: data.token,
            id: data.id,
            email: data.email,
            role: data.role
        };
    } catch (error) {
        console.error('Registration error details:', error);
        if (error.message.includes('Network error')) {
            throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }
        throw error;
    }
};

export const getCourses = async (token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }

    const res = await fetch(`${API_BASE}/courses`, {
        headers: getHeaders(token),
        credentials: 'include'
    });
    return handleResponse(res, '/courses').then(data => data.map(course => ({
        id: course.courseId,
        title: course.title,
        description: course.description,
        instructorId: course.instructorId,
        mediaUrl: course.mediaUrl
    })));
};

export const joinCourse = async (courseId, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!courseId) {
        throw new Error('Course ID is required');
    }

    try {
        console.log('Attempting to join course:', courseId);
        const res = await fetch(`${API_BASE}/courses/${courseId}/join`, {
            method: 'POST',
            headers: getHeaders(token),
            credentials: 'include'
        });

        return handleResponse(res, `/courses/${courseId}/join`);
    } catch (error) {
        console.error('Error joining course:', error);
        throw error;
    }
};

export const getJoinedCourses = async (userId, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
        const res = await fetch(`${API_BASE}/users/${userId}/courses`, {
            headers: getHeaders(token),
            credentials: 'include'
        });
        
        return handleResponse(res, `/users/${userId}/courses`).then(data => data.map(course => ({
            id: course.courseId,
            title: course.title,
            description: course.description,
            instructorId: course.instructorId,
            mediaUrl: course.mediaUrl
        })));
    } catch (error) {
        console.error('Error fetching joined courses:', error);
        throw error;
    }
};

export const getCourseAssessments = async (courseId, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!courseId) {
        throw new Error('Course ID is required');
    }

    const res = await fetch(`${API_BASE}/courses/${courseId}/assessments`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return handleResponse(res, `/courses/${courseId}/assessments`);
};

export const getUserResults = async (userId, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!userId) {
        throw new Error('User ID is required');
    }

    try {
    const res = await fetch(`${API_BASE}/users/${userId}/results`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Failed to fetch user results');
        }
        
        return data.map(result => ({
            id: result.resultId,
            assessmentId: result.assessmentId,
            userId: result.userId,
            score: result.score,
            attemptDate: new Date(result.attemptDate)
        }));
    } catch (error) {
        console.error('Error fetching user results:', error);
        throw new Error(error.message || 'Failed to fetch user results');
    }
};

export const getCourseContents = async (courseId, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!courseId) {
        throw new Error('Course ID is required');
    }

    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/contents`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to fetch course contents');
        }
        
        const data = await res.json();
        return data.map(content => ({
            id: content.contentId,
            title: content.title,
            description: content.description,
            type: content.type,
            url: content.url,
            order: content.order
        }));
    } catch (error) {
        console.error('Error fetching course contents:', error);
        throw error;
    }
};

export const startAssessment = async (assessmentId, token) => {
    if (!token) {
        console.error('No token provided to startAssessment');
        throw new Error('Authentication token is required');
    }

    if (!assessmentId) {
        console.error('No assessmentId provided to startAssessment');
        throw new Error('Assessment ID is required');
    }

    try {
        console.log('Starting assessment:', assessmentId);
        console.log('Using token:', token.substring(0, 10) + '...');
        const response = await fetch(`${API_BASE}/assessments/${assessmentId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        let data;
        try {
            data = await response.json();
            console.log('Response data:', data);
        } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error('Invalid server response');
        }

        if (!response.ok) {
            console.error('Assessment start failed:', data);
            const errorMessage = data.message || data.error || 'Failed to start assessment';
            throw new Error(errorMessage);
        }

        if (!data || !data.questions || !Array.isArray(data.questions)) {
            console.error('Invalid assessment data:', data);
            throw new Error('Invalid assessment data received from server');
        }

        console.log('Assessment started successfully:', data);
        return {
            ...data,
            duration: data.duration || 30 // Default duration if not provided
        };
    } catch (error) {
        console.error('Error starting assessment:', error);
        throw error;
    }
};

export const submitAssessment = async (assessmentId, answers, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!assessmentId) {
        throw new Error('Assessment ID is required');
    }
    if (!answers) {
        throw new Error('Answers are required');
    }

    try {
        const answersArray = Object.values(answers).map(answer => parseInt(answer));
        
        console.log('Submitting assessment:', {
            assessmentId,
            answersCount: answersArray.length,
            answers: answersArray
        });

        const res = await fetch(`${API_BASE}/assessments/${assessmentId}/submit`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(answersArray)
        });
        
        const data = await res.json();
        
        if (!res.ok) {
            throw new Error(data.message || 'Failed to submit assessment');
        }
        
        return data;
    } catch (error) {
        console.error('Error submitting assessment:', error);
        throw error;
    }
};

export const uploadCourseContent = async (courseId, content, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!courseId) {
        throw new Error('Course ID is required');
    }
    if (!content.url || !content.title || !content.description) {
        throw new Error('Content URL, title, and description are required');
    }

    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/content`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: content.title,
                description: content.description,
                type: content.type || 'document',
                url: content.url,
                order: content.order || 0
            })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Failed to upload content' }));
            throw new Error(error.message || 'Failed to upload content');
        }

        return await res.json();
    } catch (error) {
        console.error('Error uploading content:', error);
        throw error;
    }
};

export const createAssessment = async (courseId, assessment, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!courseId) {
        throw new Error('Course ID is required');
    }

    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/assessments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(assessment)
        });

        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to create assessment');
        }

        return await res.json();
    } catch (error) {
        console.error('Error creating assessment:', error);
        throw error;
    }
};

export const uploadAssessment = async (assessment, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!assessment.courseId) {
        throw new Error('Course ID is required');
    }
    if (!assessment.title) {
        throw new Error('Assessment title is required');
    }
    if (!assessment.questions || assessment.questions.length === 0) {
        throw new Error('At least one question is required');
    }

    try {
        const res = await fetch(`${API_BASE}/courses/${assessment.courseId}/assessments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: assessment.title,
                questions: assessment.questions.map(q => ({
                    text: q.text,
                    options: q.options,
                    correctOptionIndex: q.correctOptionIndex,
                    marks: q.marks
                })),
                duration: assessment.duration
            })
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: 'Failed to create assessment' }));
            throw new Error(error.message || 'Failed to create assessment');
        }

        return await res.json();
    } catch (error) {
        console.error('Error creating assessment:', error);
        throw error;
    }
};

export const getStudentPerformance = async (courseId, token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }
    if (!courseId) {
        throw new Error('Course ID is required');
    }

    try {
        const res = await fetch(`${API_BASE}/courses/${courseId}/student-performance`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'Failed to fetch student performance');
        }
        
        return await res.json();
    } catch (error) {
        console.error('Error fetching student performance:', error);
        throw error;
    }
};

