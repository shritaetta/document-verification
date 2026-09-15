'use server'

export async function getFacultyInviteCode() {
  return process.env.FACULTY_INVITE_CODE || 'CODE_NOT_SET'
}
