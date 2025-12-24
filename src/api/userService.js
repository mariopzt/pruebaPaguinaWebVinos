import api from './axios'

const userService = {
  // Actualizar perfil del usuario
  updateProfile: async (userId, data) => {
    // Nota: la baseURL ya incluye /api, así que no lo repetimos aquí
    const response = await api.put(`/users/${userId}`, data)
    return response.data
  },

  // Obtener perfil del usuario
  getProfile: async (userId) => {
    // Nota: la baseURL ya incluye /api, así que no lo repetimos aquí
    const response = await api.get(`/users/${userId}`)
    return response.data
  }
}

export default userService

