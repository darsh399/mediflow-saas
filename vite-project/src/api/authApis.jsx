import api from "./axiosInstance";

const signUp = (data) => {
    return api.post('/register', data);
}


const login = (userData) => {
    return api.post('/login', userData);
}


const getUser = (id) => {
    return api.get(`/users/${id}`);
}


const updateUser = (id, newData) => {
    return api.post(`/users/${id}`, newData);
}