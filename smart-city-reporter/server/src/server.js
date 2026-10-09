import dotenv from "dotenv";
dotenv.config(); // must run before other imports use process.env

const { validateEnv } = await import("./config/env.js");
validateEnv();

const { default: app } = await import("./app.js");
const { default: connectDB } = await import("./config/db.js");

await connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
