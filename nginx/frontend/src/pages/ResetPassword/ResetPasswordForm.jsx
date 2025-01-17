import React, { useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from 'react-toastify'
import style from './ResetPasswordForm.module.scss'
import ResetPassword from "../../api/authServiceResetPassword"

const ResetPasswordForm = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { token } = useParams();

    const [formData, setFormData] = useState({
        password: "",
        password_confirmation: "",
    });

    const [errors, setErrors] = useState({
        password: "",
        password_confirmation: "",
        error: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
        setErrors((prev) => ({
            ...prev,
            [name]: "",
            error: "",
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
        }

        if (!formData.password_confirmation) {
            newErrors.password_confirmation = "Please confirm your password";
        } else if (formData.password !== formData.password_confirmation) {
            newErrors.password_confirmation = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setLoading(true);
        try {
            const response = await ResetPassword(token,formData);

            toast.success(response.message, {
                position: "top-right",
                autoClose: 3000,
            });
            navigate('/login');
        } catch (err) {
            if (err.response?.data) {
				const apiErrors = err.response.data;
				Object.keys(apiErrors).forEach((field) => {
					if (Array.isArray(apiErrors[field])) {
						errors[field] = apiErrors[field][0];
					}
				});
			}
			setErrors(errors);
			if (errors.error) {
				toast.error(errors.error, {
					position: "top-right",
					autoClose: 2000,
					hideProgressBar: false,
					closeOnClick: true,
					pauseOnHover: true,
					draggable: true,
					theme: "light",
				});
			}
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex ${style.newBody}`}>
            <div className={`${style.form} flex flex-col justify-center items-center  w-full lg:w-[40rem]   border-x-2 border-blue-400 p-8 text-white relative `}>
                <h1 className={`text-3xl font-extrabold text-center ${style.glowText} mb-4`}>
                    Reset Password
                </h1>
                <p className="text-center text-gray-400 mb-8">
                    Please enter your new password
                </p>

                <form className="w-full max-w-md " >
                    <div className="flex flex-col items-center">
                        <div className="w-full mb-5">
                            <input
                                type="password"
                                name="password"
                                placeholder="New Password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="off"
                                className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${errors.password ? "border-red-500" : "border-gray-600"
                                    } placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                            )}
                        </div>

                        <div className="w-full mb-5">
                            <input
                                type="password"
                                name="password_confirmation"
                                placeholder="Confirm New Password"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                autoComplete="off"
                                className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${errors.password_confirmation ? "border-red-500" : "border-gray-600"
                                    } placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
                            />
                            {errors.password_confirmation && (
                                <p className="mt-1 text-sm text-red-500">{errors.password_confirmation}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            onClick={handleResetPassword}
                            className={`${style.retroButton} w-full font-bold shadow-sm rounded-lg py-3 text-white flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none mb-4`}
                        >
                            Reset Password
                        </button>

                        <div className="my-12 border-b text-center w-full">
                            <div className="leading-none px-2 inline-block text-sm text-gray-400 tracking-wide font-medium bg-black transform translate-y-1/2">
                                Or
                            </div>
                        </div>

                        <div className="text-center">
                            <Link to="/login" className="text-[#00d4ff] hover:text-gray-400">
                                Back to Login
                            </Link>
                        </div>
                    </div>
                </form>
            </div>

            <div className="hidden lg:block lg:absolute transitionEffect"></div>
            <div className="hidden lg:flex flex-1 imagePlaceholder"></div>
        </div>
    );
};

export default ResetPasswordForm;