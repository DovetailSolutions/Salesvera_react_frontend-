// Full socket.io client code with updated events
// Events used:
// emit: joinRoom
// listen: roomJoin, userList

import { io } from "socket.io-client";

const URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const socket = io(URL, {
  transports: ["websocket"],
  autoConnect: false,
});

// ------------------------
// CONNECT
// ------------------------
export const connectSocket = () => {
  if (!socket.connected) socket.connect();
};

// ------------------------
// JOIN ROOM
// ------------------------
export const joinRoom = (roomId, user) => {
  socket.emit("joinRoom", { roomId, user });
};

// ------------------------
// LISTENERS
// ------------------------
export const registerRoomJoinListener = (callback) => {
  socket.on("roomJoin", (data) => {
    callback(data);
  });
};

export const registerUserListListener = (callback) => {
  socket.on("userList", (users) => {
    callback(users);
  });
};

// ------------------------
// SEND MESSAGE (Kept intact)
// ------------------------
export const sendMessage = (roomId, message) => {
  socket.emit("sendMessage", { roomId, message });
};

export const registerMessageListener = (callback) => {
  socket.on("receiveMessage", (message) => {
    callback(message);
  });
};

// ------------------------
// TYPING EVENTS (Kept intact)
// ------------------------
export const startTyping = (roomId, user) => {
  socket.emit("typing", { roomId, user });
};

export const stopTyping = (roomId, user) => {
  socket.emit("stopTyping", { roomId, user });
};

export const registerTypingListener = (callback) => {
  socket.on("typing", (data) => callback(data));
};

export const registerStopTypingListener = (callback) => {
  socket.on("stopTyping", (data) => callback(data));
};

// ------------------------
// ONLINE USERS (Kept intact)
// ------------------------
export const registerOnlineUsersListener = (callback) => {
  socket.on("onlineUsers", (list) => callback(list));
};

// ------------------------
// DISCONNECT HANDLER (Kept intact)
// ------------------------
export const disconnectSocket = () => {
  if (socket.connected) socket.disconnect();
};

export default socket;
