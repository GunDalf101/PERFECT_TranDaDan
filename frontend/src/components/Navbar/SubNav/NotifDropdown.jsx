import React from "react";

const NotifDropdown = React.forwardRef(({isVisible}, ref) => {
    console.log("NotifDropdown isVisible: ", isVisible);
  return isVisible? (
    <div
      id="notificationDropdown"
      className="notification-dropdown absolute text-white right-0 mt-2 w-auto bg-gray-900 text-teal-200 border-2 border-pink-500 shadow-lg rounded-md font-pixel z-10"
      ref={ref}
    >
      <div className="p-2">
        <p className="text-center font-bold text-lg">Notifications</p>
        <ul className="mt-2 text-sm">
          <li className="py-2 px-4 border-b border-pink-500">
            <p className="font-semibold">Title 1</p>
            <p className="text-xs opacity-75">
              This is the body of notification 1.
            </p>
          </li>
          <li className="py-2 px-4 border-b border-pink-500">
            <p className="font-semibold">Title 2</p>
            <p className="text-xs opacity-75">
              This is the body of notification 2.
            </p>
          </li>
          <li className="py-2 px-4">
            <p className="font-semibold">Title 3</p>
            <p className="text-xs opacity-75">
              This is the body of notification 3.
            </p>
          </li>
        </ul>
      </div>
    </div>
  ) : null;
});

export default NotifDropdown;
