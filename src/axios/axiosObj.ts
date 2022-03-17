import axios from "axios";

axios.defaults.withCredentials = true;

const axiosObj = axios.create({
  timeout: 1000000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

export default axiosObj;
