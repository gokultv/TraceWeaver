import axios from 'axios';

const JAEGER_API_URL = '/api';

export const fetchTraces = async () => {
    try {
        // Fetch last 5 traces from service-a in the last hour
        const response = await axios.get(`${JAEGER_API_URL}/traces`, {
            params: {
                service: 'service-a',
                limit: 5,
                lookback: '1h',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching traces:', error);
        return null;
    }
};
