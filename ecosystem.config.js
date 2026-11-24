module.exports = {
    apps: [
        {
            name: "dreamcv-backend",
            script: "server.js",
            cwd: "./backend"
        },
        {
            name: "dreamcv-live",
            script: "C:\\Users\\reddy\\AppData\\Roaming\\npm\\node_modules\\live-server\\live-server.js",
            cwd: "./",
            args: "frontend --port=5500 --host=127.0.0.1 --no-browser"
        }
    ]
};
