import axiosInstance from "../utils/axios";

export const listAdmins = async () => {
    const response = await axiosInstance.get("/auth/admins");
    return response.data;
};

export const createAdmin = async (adminData) => {
    const response = await axiosInstance.post("/auth/register", adminData);
    return response.data;
};

export const toggleAdminStatus = async (adminId) => {
    const response = await axiosInstance.patch(
        `/auth/admins/${adminId}/toggle-status`,
    );
    return response.data;
};

export const updateAdmin = async (adminId, data) => {
    const response = await axiosInstance.patch(`/auth/admins/${adminId}`, data);
    return response.data;
};

export default { listAdmins, createAdmin, toggleAdminStatus, updateAdmin };
