import { redirect } from 'next/navigation'

// Registration is now the wholesale application (account + business info + tax).
export default function RegisterPage() {
  redirect('/apply')
}
