import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
})

// Session token from the hardcoded-credential login lives in localStorage
// (not a cookie/Firebase SDK), so every outgoing request just reads it from
// there and attaches it as a Bearer token.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('hireflow_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default client
