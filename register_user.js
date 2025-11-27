import axios from 'axios';

const registerUser = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Script User',
            email: 'script@test.com',
            password: 'password123',
            role: 'student'
        });
        console.log('Registration successful:', response.data);
    } catch (error) {
        console.error('Registration failed:', error.response ? error.response.data : error.message);
    }
};

registerUser();
