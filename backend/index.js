const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const app = express()

dotenv.config();

const PORT = process.env.PORT || 5000

const { createCorsOptions } = require("./config/corsOptions.js");
const Routes = require("./routes/route.js");
const { createRequestContext } = require("./middleware/requestContext.js");
const {
    createApiErrorHandler,
    createNotFoundHandler,
} = require("./middleware/apiErrorHandler.js");

// Establish a request id before any middleware that may reject a request.
// Access logging records only route templates and response metadata.
app.use(createRequestContext());
app.use(cors(createCorsOptions()));
app.use(express.json({ limit: "10mb" }));

mongoose
    .connect(process.env.MONGO_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((error) => {
        // Avoid printing raw connection errors, which may contain a Mongo URI
        // or credentials from the environment.
        console.error(JSON.stringify({
            event: "database_connection_failed",
            errorName: error && typeof error.name === "string" ? error.name : "Error",
            errorCode: error && typeof error.code === "string" ? error.code : undefined,
        }));
    });

app.use("/", Routes);
app.use(createNotFoundHandler());
app.use(createApiErrorHandler());

app.listen(PORT, () => {
    console.log(`Server started at port no. ${PORT}`)
});
