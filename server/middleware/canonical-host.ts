import {
  defineEventHandler,
  getHeader,
  getRequestURL,
  sendRedirect,
} from 'h3'

export default defineEventHandler((event) => {
  if (process.env.NODE_ENV !== 'production') return
  const host = getHeader(event, 'host')?.split(':')[0]?.toLowerCase()
  if (host !== 'www.clean-marketplace.com') return
  const target = new URL(getRequestURL(event).pathname + getRequestURL(event).search, 'https://clean-marketplace.com')
  return sendRedirect(event, target.toString(), 308)
})
