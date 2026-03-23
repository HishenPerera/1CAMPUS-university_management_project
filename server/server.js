require("dotenv").config();
const app = require("./src/app");
const cronJobs = require('./cronJobs');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

