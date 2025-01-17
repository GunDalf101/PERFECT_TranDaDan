import React, { useEffect, useState } from "react";
import styles from "./Login.module.scss";
import alogo from "../../assets/image/42_Logo.png";
import { Link, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import LoginAx from "../../api/authServiceLogin";
import {getMyData} from "../../api/authServiceMe";
import RequestResetPassword from "../../api/authServiceRequestRp";
import MFAVerificationForm from "./MFAVerificationForm";
import authVerifyMFA from "../../api/authVerifyMFA"

import { useUser } from '../../components/auth/UserContext'

const Login = () => {
	const [loading, setLoading] = useState(false);
	const { login } = useUser();
	const [showResetForm, setShowResetForm] = useState(false);
	const navigate = useNavigate();
	const [showMFAForm, setShowMFAForm] = useState(false);

	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});

	const [resetFormData, setResetFormData] = useState({
		email: "",
	});

	const [loginErrors, setLoginErrors] = useState({
		email: "",
		password: "",
		general: "",
	});

	const [resetErrors, setResetErrors] = useState({
		email: "",
		general: "",
	});

	const handleLoginChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({
			...prev,
			[name]: value,
		}));
		setLoginErrors(prev => ({
			...prev,
			[name]: "",
			general: "",
		}));
	};

	const handleResetChange = (e) => {
		const { name, value } = e.target;
		setResetFormData(prev => ({
			...prev,
			[name]: value,
		}));
		setResetErrors(prev => ({
			...prev,
			[name]: "",
			general: "",
		}));
	};

	const handleResetPassword = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await RequestResetPassword(resetFormData);
			toast.success(response.data.message, {
				position: "top-right",
				autoClose: 3000,
			});
			setShowResetForm(false);
			setResetFormData({ email: "" });
		} catch (err) {
			const apiErrors = err.response?.data;
			if (apiErrors) {
				setResetErrors(prev => ({
					...prev,
					email: Array.isArray(apiErrors.email) ? apiErrors.email[0] : "",
					general: apiErrors.message || "Failed to send reset link"
				}));

				if (apiErrors.message) {
					toast.error(apiErrors.message, {
						position: "top-right",
						autoClose: 2000,
					});
				}
			}
		} finally {
			setLoading(false);
		}
	};


	const handleLogin = async (e) => {
		e.preventDefault();
		setLoading(true);

		try {
			const response = await LoginAx(formData);
			const { access_token } = response.data;

			if (response.data.mfa_required) {
				localStorage.setItem('2fa_access_token', access_token);
				setShowMFAForm(true);
				setLoading(false);
				return;
			}
			localStorage.setItem('access_token', access_token);
			const data = await getMyData();
			const userJSON = JSON.stringify(data);
			login(userJSON);
			navigate('/');
		} catch (err) {
			if (err.response?.data) {
				const apiErrors = err.response.data;
				Object.keys(apiErrors).forEach((field) => {
					if (Array.isArray(apiErrors[field])) {
						loginErrors[field] = apiErrors[field][0];
					} else {
						loginErrors.general = "Invalid credentials.";
					}
				});
			}
			setLoginErrors(loginErrors);
			if (loginErrors.general) {
				toast.error(loginErrors.general, {
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

    const handle42Login = () => {
        window.location.href = `/api/oauth2/42/`;
    };

	const handleMFAVerify = async (Mfadata) => {
		try {
			const response = await authVerifyMFA(Mfadata);
			const { access_token } = response.data;
			localStorage.removeItem('2fa_access_token');
			localStorage.setItem("access_token", access_token);
			const data = await getMyData();
			const userJSON = JSON.stringify(data);
			login(userJSON);
			navigate("/");
		} catch (err) {
			throw new Error(err.response?.data?.message || "Invalid verification code");
		}
	};
	return (
		<div className={`flex ${styles.newBody}`}>
			<div className="flex flex-col justify-center items-center w-full lg:w-2/5 p-8 bg-black text-white relative">
				<Link to="/">
					<button className="absolute top-4 left-4 rounded-full bg-transparent transition-colors w-[40px] h-[40px]">
						<svg
							fill="#00d4ff"
							className="w-6 h-6"
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 330 330"
						>
							<path d="M111.213,165.004L250.607,25.607c5.858-5.858,5.858-15.355,0-21.213c-5.858-5.858-15.355-5.858-21.213,0.001 l-150,150.004C76.58,157.211,75,161.026,75,165.004c0,3.979,1.581,7.794,4.394,10.607l150,149.996 C232.322,328.536,236.161,330,240,330s7.678-1.464,10.607-4.394c5.858-5.858,5.858-15.355,0-21.213L111.213,165.004z" />
						</svg>
					</button>
				</Link>

				<h1
					className={`text-3xl font-extrabold text-center ${styles.glowText} mb-4`}
				>
					TranDaDan
				</h1>
				<p className="text-center text-gray-400 mb-8">
					A whole world of games waiting for you!
				</p>
				{!showResetForm ? (
					<form className="w-full max-w-md">
						<div className="flex flex-col items-center">
							<div className="w-full mb-5">
								<input
									type="email"
									name="email"
									placeholder="Email"
									value={formData.email}
									onChange={handleLoginChange}
									autoComplete="current-email"
									className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${loginErrors.email ? "border-red-500" : "border-gray-600"
										} placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
								/>
								{loginErrors.email && (
									<p className="mt-1 text-sm text-red-500">{loginErrors.email}</p>
								)}
							</div>

							<div className="w-full mb-5">
								<input
									type="password"
									name="password"
									placeholder="Password"
									value={formData.password}
									onChange={handleLoginChange}
									autoComplete="current-password"
									className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${loginErrors.password ? "border-red-500" : "border-gray-600"
										} placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
								/>
								{loginErrors.password && (
									<p className="mt-1 text-sm text-red-500">{loginErrors.password}</p>
								)}
							</div>
							<div className="text-right w-full mb-5">
								<button
									type="button"
									onClick={() => setShowResetForm(true)}
									className="text-sm text-[#00d4ff] hover:text-gray-400"
								>
									Forgot Password?
								</button>
							</div>
							<button
								type="submit"
								onClick={handleLogin}
								className={`${styles.retroButton} w-full font-bold shadow-sm rounded-lg py-3 text-white flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none`}
							>
								Login
							</button>
						</div>
						<div className="my-12 border-b text-center">
							<div className="leading-none px-2 inline-block text-sm text-gray-400 tracking-wide font-medium bg-black transform translate-y-1/2">
								Or login with
							</div>
						</div>
						<div className="flex justify-center space-x-4">
							<button
								type="button"
								className="w-14 h-14 rounded-full bg-gray-100 hover:bg-[#00d4ff] transition-colors flex items-center justify-center"
								onClick={handle42Login}

							>
								<img className="w-10 h-10" src={alogo} />
							</button>
						</div>
					</form>
				) : (
					<form className="w-full max-w-md">
						<div className="flex flex-col items-center">
							<h2 className="text-2xl font-bold mb-6">Reset Password</h2>
							<p className="text-gray-400 text-center mb-6">
								Enter your email address and we'll send you a link to reset your password.
							</p>

							<div className="w-full mb-5">
								<input
									type="email"
									name="email"
									placeholder="Enter your email"
									value={resetFormData.email}
									onChange={handleResetChange}
									autoComplete="off"
									className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${resetErrors.email ? "border-red-500" : "border-gray-600"
										} placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
								/>
								{resetErrors.email && (
									<p className="mt-1 text-sm text-red-500">{resetErrors.email}</p>
								)}
							</div>
							<button
								type="submit"
								onClick={handleResetPassword}
								className={`${styles.retroButton} w-full bord font-bold shadow-sm rounded-lg py-3 text-white flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none mb-4`}
							>
								Send Reset Link
							</button>

							<button
								type="button"
								onClick={() => {
									setShowResetForm(false);
									setResetErrors(prev => ({ ...prev, email: "" }));
								}}
								className="text-sm text-[#00d4ff] hover:text-gray-400"
							>
								Back to Login
							</button>
						</div>
					</form>
				)}
				<p className="mt-6 text-xs text-gray-600 text-center">
					Don't have an account?{" "}
					<Link to="/register" className="text-[#00d4ff] hover:underline">
						Register
					</Link>
				</p>
				{showMFAForm && (
			<MFAVerificationForm
				onVerify={handleMFAVerify}
				onCancel={() => setShowMFAForm(false)}
			/>
        	)}
			</div>

			<div
				className={`hidden lg:block lg:absolute ${styles.transitionEffect}`}
			></div>

			<div className={`hidden lg:flex flex-1 ${styles.imagePlaceholder}`}></div>

		</div>
	);
};

export default Login;
