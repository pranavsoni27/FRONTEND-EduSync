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

// Common fetch options for all requests
const getFetchOptions = (method, body = null, token = null) => ({
    method,
    headers: getHeaders(token),
    mode: 'cors',
    credentials: 'omit',
    cache: 'no-cache',
    redirect: 'follow',
    ...(body && { body: JSON.stringify(body) })
});

// Retry logic for failed requests
const retryFetch = async (url, options, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempt ${i + 1} to fetch ${url}`);
            const response = await fetch(url, options);
            
            // Log response details for debugging
            console.log('Response status:', response.status);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Get response text for logging
            const responseText = await response.text();
            console.log('Response text:', responseText);
            
            if (response.ok) {
                return response;
            }
            
            // If we get a CORS error or network error, wait and retry
            if (response.status === 0 || response.status === 404) {
                console.log(`Attempt ${i + 1} failed, retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                // Try to parse the response as JSON for more detailed error message
                const errorData = JSON.parse(responseText);
                if (errorData.message) {
                    errorMessage += ` - ${errorData.message}`;
                }
                if (errorData.error) {
                    errorMessage += ` (${errorData.error})`;
                }
                if (errorData.errors) {
                    errorMessage += ` - Validation errors: ${JSON.stringify(errorData.errors)}`;
                }
            } catch (e) {
                // If response isn't JSON, use the raw text
                if (responseText) {
                    errorMessage += ` - ${responseText}`;
                }
            }
            throw new Error(errorMessage);
        } catch (error) {
            console.error(`Attempt ${i + 1} failed:`, error);
            if (i === retries - 1) throw error;
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw new Error('Max retries reached');
};

export const uploadCourse = async (course, token) => {
    const res = await fetch(`${API_BASE}/courses`, getFetchOptions('POST', course, token));
    return handleResponse(res, '/courses');
};

export const login = async (email, password, role) => {
    try {
        console.log('Login attempt with data:', { email, role });
        const endpoint = '/auth/login';
        const url = `${API_BASE}${endpoint}`;
        console.log('Making request to:', url);

        const response = await retryFetch(url, getFetchOptions('POST', { email, password, role }));
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

export const register = async (email, password, role, firstName, lastName) => {
    try {
        const payload = { 
            email, 
            password, 
            role,
            firstName,
            lastName
        };
        console.log('Registration payload:', JSON.stringify(payload, null, 2));
        console.log('Attempting to register with:', { ...payload, password: '***' });
        const endpoint = '/auth/register';
        const url = `${API_BASE}${endpoint}`;
        console.log('Making request to:', url);

        // Try the request with retry logic
        const response = await retryFetch(url, getFetchOptions('POST', payload));
        
        // Log the raw response for debugging
        console.log('Raw response:', response);
        const responseText = await response.text();
        console.log('Response text:', responseText);
        
        // Parse the response text as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('Error parsing response:', e);
            throw new Error(`Invalid JSON response: ${responseText}`);
        }
        
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
        if (error.message.includes('Network error') || error.message.includes('Failed to fetch')) {
            throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }
        throw error;
    }
};

export const getCourses = async (token) => {
    if (!token) {
        throw new Error('Authentication token is required');
    }

    const res = await fetch(`${API_BASE}/courses`, getFetchOptions('GET', null, token));
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
        const res = await fetch(`${API_BASE}/courses/${courseId}/join`, getFetchOptions('POST', null, token));
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

