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
import { env } from "../../config/env";

import { useUser } from '../../components/auth/UserContext'

const Login = () => {
	const [loading, setLoading] = useState(false);
	const { login } = useUser();
	const [showResetForm, setShowResetForm] = useState(false);
	const navigate = useNavigate();
	const queryParams = new URLSearchParams(window.location.search);
	// const validate = queryParams.get("validate");
	const [showMFAForm, setShowMFAForm] = useState(false);


	// useEffect(() => {
	// 	toast.success(validate,
	// 		{
	// 			position: "top-right",
	// 			autoClose: 3000,
	// 		}
	// 	);
	// }, [validate])

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
			// console.log(response);
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
							<button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-[#00d4ff] transition-colors flex items-center justify-center">
								<svg
									viewBox="-3 0 262 262"
									className="w-8 h-8"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
										fill="#4285F4"
									/>
									<path
										d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
										fill="#34A853"
									/>
									<path
										d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
										fill="#FBBC05"
									/>
									<path
										d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
										fill="#EB4335"
									/>
								</svg>
							</button>
							<button
								type="button"
								className="w-14 h-14 rounded-full bg-gray-100 hover:bg-[#00d4ff] transition-colors flex items-center justify-center"
								onClick={handle42Login}

							>
								<img className="w-10 h-10" src={alogo} />
							</button>
							<button className="w-14 h-14 rounded-full bg-gray-100 hover:bg-[#00d4ff] transition-colors flex items-center justify-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="w-12 h-12"
									x="0px"
									y="0px"
									viewBox="0 0 32 32"
								>
									<path
										fillRule="evenodd"
										d="M 16 4 C 9.371094 4 4 9.371094 4 16 C 4 21.300781 7.4375 25.800781 12.207031 27.386719 C 12.808594 27.496094 13.027344 27.128906 13.027344 26.808594 C 13.027344 26.523438 13.015625 25.769531 13.011719 24.769531 C 9.671875 25.492188 8.96875 23.160156 8.96875 23.160156 C 8.421875 21.773438 7.636719 21.402344 7.636719 21.402344 C 6.546875 20.660156 7.71875 20.675781 7.71875 20.675781 C 8.921875 20.761719 9.554688 21.910156 9.554688 21.910156 C 10.625 23.746094 12.363281 23.214844 13.046875 22.910156 C 13.15625 22.132813 13.46875 21.605469 13.808594 21.304688 C 11.144531 21.003906 8.34375 19.972656 8.34375 15.375 C 8.34375 14.0625 8.8125 12.992188 9.578125 12.152344 C 9.457031 11.851563 9.042969 10.628906 9.695313 8.976563 C 9.695313 8.976563 10.703125 8.65625 12.996094 10.207031 C 13.953125 9.941406 14.980469 9.808594 16 9.804688 C 17.019531 9.808594 18.046875 9.941406 19.003906 10.207031 C 21.296875 8.65625 22.300781 8.976563 22.300781 8.976563 C 22.957031 10.628906 22.546875 11.851563 22.421875 12.152344 C 23.191406 12.992188 23.652344 14.0625 23.652344 15.375 C 23.652344 19.984375 20.847656 20.996094 18.175781 21.296875 C 18.605469 21.664063 18.988281 22.398438 18.988281 23.515625 C 18.988281 25.121094 18.976563 26.414063 18.976563 26.808594 C 18.976563 27.128906 19.191406 27.503906 19.800781 27.386719 C 24.566406 25.796875 28 21.300781 28 16 C 28 9.371094 22.628906 4 16 4 Z"
									></path>
								</svg>
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
									// onChange={(e) => handleChange(e.target.value)}
									onChange={handleResetChange}
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
								// disabled={loading}
								className={`${styles.retroButton} w-full bord font-bold shadow-sm rounded-lg py-3 text-white flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none mb-4`}
							>
								{/* {loading ? "Sending..." : "Send Reset Link"} */}
								Send Reset Link
							</button>

							<button
								type="button"
								onClick={() => {
									setShowResetForm(false);
									// setResetForm("");
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
