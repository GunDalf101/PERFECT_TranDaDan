import React from "react";
import styles from "../styles.module.scss";
import { Info, X, Ban, Mail, Phone } from "lucide-react";
import imag1 from "./1189258767129399428.webp";

const DynamicSidebar = ({ selectedUser, onClose }) => {
  return (
    <div className={`${styles.dynamic_sidebar_container}`}>
      <div className={`${styles.dynamic_sidebar}`}>
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-white hover:bg-white/10 rounded-full p-2"
        >
          <X className="w-6 h-6" />
        </button>
        <div className=" rounded-lg p-6 space-y-6 text-white">
          <div className="p-6 rounded-3xl max-w-[320px] overflow-hidden ">
            <div className="flex flex-col items-center space-y-4 ">
              <div className="w-48 h-48 rounded-full bg-blue-300 flex items-center justify-center  border-solid ring-4">
                {/* <span className="text-white text-2xl font-semibold">
                  {selectedUser.name[0]}
                </span> */}
                <img
                  src={imag1}
                  // alt={`${user.name}'s avatar`}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <div className="text-center">
                <h2 className="font-semibold text-xl text-white">
                  {selectedUser.name}
                </h2>
                <span className="text-gray-400">{selectedUser.title}</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-4">
            <h3 className="font-medium mb-2 text-gray-300">
              Contact Information
            </h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400" />
                <span>{selectedUser.email}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-green-400" />
                <span>{selectedUser.phone || "Not provided"}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium mb-2 text-gray-300">Actions</h3>
            <div className="space-y-2">
              <button className="w-full p-2 text-left flex items-center space-x-2 hover:bg-gray-700 rounded-lg transition-colors duration-200">
                <Info className="w-5 h-5 text-blue-400" />
                <span>View Profile</span>
              </button>
              {/* <button className="w-full p-2 text-left flex items-center space-x-2 hover:bg-gray-700 rounded-lg transition-colors duration-200">
                <Users className="w-5 h-5 text-purple-400" />
                <span>Shared Contacts</span>
              </button> */}
              <button className="w-full p-2 text-left flex items-center space-x-2 hover:bg-red-500 rounded-lg text-red-400 hover:text-white transition-colors duration-200">
                <Ban className="w-5 h-5" />
                <span>Block User</span>
              </button>
            </div>
          </div>

          {/* <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Joined</span>
              <span className="text-sm text-gray-400">
                {new Date(selectedUser.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default DynamicSidebar;
