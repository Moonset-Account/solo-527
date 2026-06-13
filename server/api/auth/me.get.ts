export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    supervisorId: user.supervisorId,
  }
})
