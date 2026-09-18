import axios from "axios";

const api = axios.create({
  baseURL: "https://masadaverse.onrender.com/api"
});

export default api;