import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Register.module.scss";
import alogo from "../../assets/image/42_Logo.png";
import { Link } from "react-router-dom";
import RegisterAx from "../../api/authServiceRegister";
import { toast } from 'react-toastify';


const Register = () => {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		password_confirmation: "",
	});
	const [errors, setErrors] = useState({
		username: "",
		email: "",
		password: "",
		password_confirmation: "",
		general: "",
	});

	const validateForm = () => {
		let isValid = true;
		const newErrors = {
			username: "",
			email: "",
			password: "",
			password_confirmation: "",
			general: "",
		};

		if (!formData.username.trim()) {
			newErrors.username = "Username is required";
			isValid = false;
		} else if (formData.username.length < 3) {
			newErrors.username = "Username must be at least 3 characters long";
			isValid = false;
		} else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
			newErrors.username =
				"Username can only contain letters, numbers, underscores, and hyphens";
			isValid = false;
		}

		if (!formData.email) {
			newErrors.email = "Email is required";
			isValid = false;
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = "Please enter a valid email address";
			isValid = false;
		}

		if (!formData.password) {
			newErrors.password = "Password is required";
			isValid = false;
		}
		else if (formData.password.length < 8) {
			newErrors.password = "Password must be at least 8 characters long";
			isValid = false;
		} else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
			newErrors.password =
				"Password must contain at least one uppercase letter, one lowercase letter, and one number";
			isValid = false;
		}

		if (!formData.password_confirmation) {
			newErrors.password_confirmation = "Please confirm your password";
			isValid = false;
		}

		setErrors(newErrors);
		return isValid;
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prevState) => ({
			...prevState,
			[name]: value,
		}));
		setErrors((prev) => ({
			...prev,
			[name]: "",
			general: "",
		}));
	};

	const handleRegister = async (e) => {
		e.preventDefault();

		if (!validateForm()) {
			return;
		}
		try {
			const response = await RegisterAx(formData);
			if (response.status === 201) navigate("/login");
		} catch (err) {
			if (err.response?.data) {
				const apiErrors = err.response.data;
				Object.keys(apiErrors).forEach((field) => {
					if (Array.isArray(apiErrors[field])) {
						errors[field] = apiErrors[field][0];
					} else {
						errors.general = "Invalid credentials.";
					}
				});
				setErrors(errors);
				if (errors.general) {
					toast.error(errors.general, {
					  position: "top-right",
					  autoClose: 2000,
					  hideProgressBar: false,
					  closeOnClick: true,
					  pauseOnHover: true,
					  draggable: true,
					  theme: "light",
					});
				  }
			}
		}
	};

	const handle42Login = () => {
		window.location.href = `/api/oauth2/42/`;
	};

	return (
		<div className={`flex ${styles.newBody}`}>
			<Link to="/">
				<button className="absolute z-10 top-4 left-4 rounded-full bg-transparent transition-colors w-[40px] h-[40px]">
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

			<div className={`hidden lg:flex flex-1 ${styles.imagePlaceholder}`}></div>
			<div
				className={`hidden lg:block lg:absolute ${styles.transitionEffect}`}
			></div>

			<div className="flex flex-col justify-center items-center w-full lg:w-2/5 p-8 bg-black text-white relative">
				<h1
					className={`text-3xl font-extrabold text-center ${styles.glowText} mb-4`}
				>
					TranDaDan
				</h1>
				<p className="text-center text-gray-400 mb-8">
					A whole world of games waiting for you!
				</p>

				<form className="w-full max-w-md">
					<div className="flex flex-col items-center">
						<div className="w-full mb-5">
							<input
								type="text"
								name="username"
								placeholder="Username"
								value={formData.username}
								onChange={handleChange}
								autoComplete="username"
								className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${errors.username ? "border-red-500" : "border-gray-600"
									} placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
							/>
							{errors.username && (
								<p className="mt-1 text-sm text-red-500">{errors.username}</p>
							)}
						</div>

						<div className="w-full mb-5">
							<input
								type="email"
								name="email"
								placeholder="Email"
								value={formData.email}
								onChange={handleChange}
								autoComplete="email"
								className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${errors.email ? "border-red-500" : "border-gray-600"
									} placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
							/>
							{errors.email && (
								<p className="mt-1 text-sm text-red-500">{errors.email}</p>
							)}
						</div>

						<div className="w-full mb-5">
							<input
								type="password"
								name="password"
								placeholder="Password"
								value={formData.password}
								onChange={handleChange}
								autoComplete="Password"
								className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${errors.password ? "border-red-500" : "border-gray-600"
									} placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
							/>
							{errors.password && (
								<p className="mt-1 text-sm text-red-500">{errors.password}</p>
							)}
						</div>

						<div className="w-full mb-5">
							<div className="text-right w-full mb-5">
								<input
									type="password"
									name="password_confirmation"
									placeholder="Confirm Password"
									value={formData.password_confirmation}
									onChange={handleChange}
									autoComplete="password_confirmation"
									className={`w-full px-8 py-4 rounded-lg font-medium bg-gray-800 border ${errors.password_confirmation
										? "border-red-500"
										: "border-gray-600"
										}
									placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-gray-900 text-white`}
								/>
								{errors.password_confirmation && (
									<p className="mt-1 text-sm text-red-500">
										{errors.password_confirmation}
									</p>
								)}
							</div>
							<button
								type="submit"
								className={`${styles.retroButton} w-full font-bold shadow-sm rounded-lg py-3 text-white flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none`}
								onClick={handleRegister}
							>
								Register
							</button>
						</div>
						<div className="my-8 border-b text-center">
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
					</div>
				</form>

				<p className="mt-6 text-xs text-gray-600 text-center">
					Do you already have an account?{" "}
					<Link to="/login" className="text-[#00d4ff] hover:underline">
						Log in
					</Link>
				</p>
			</div>
		</div>
	);
};

export default Register;
