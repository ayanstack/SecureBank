let io

export const setIO = (socketIO) => {
    io = socketIO
}

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.IO is not initialized");
    }
    return io
}
