import axiosInstance from "../utils/axios";

export const getAllCustomers = async (params = {}) => {
    const response = await axiosInstance.get("/users", { params });
    return response.data;
};

export const getCustomerById = async (userId) => {
    const response = await axiosInstance.get(`/users/${userId}`);
    return response.data;
};

export const toggleCustomerStatus = async (userId) => {
    const response = await axiosInstance.patch(
        `/users/${userId}/toggle-status`,
    );
    return response.data;
};
