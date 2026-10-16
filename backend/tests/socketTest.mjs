import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

    socket.emit(
        "join-user-room",
        "6abe0a44a359883a7b1aac5f"
    );

    console.log("User room joined");

    socket.emit(
        "test-notification",
        "6abe0a44a359883a7b1aac5f"
    );
});

socket.on("notification", (notification) => {
    console.log(
        "Notification received:",
        notification
    );
});

socket.on("connect_error", (error) => {
    console.error(
        "Socket connection error:",
        error.message
    );
});