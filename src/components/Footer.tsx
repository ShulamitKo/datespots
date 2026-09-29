import { Copyright } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ContactForm } from './ContactForm'
import { TermsDialog } from './TermsDialog'

const linkClass = 'text-sm text-gray-700 underline underline-offset-2 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded'

export default function Footer() {
  return (
    <footer className="w-full py-4 mt-auto bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-gray-700">
          <div className="flex items-center gap-2">
            <Copyright className="h-3.5 w-3.5 text-gray-500" aria-hidden="true" />
            <span className="text-sm">כל הזכויות שמורות {new Date().getFullYear()}</span>
          </div>
          <nav aria-label="מידע משפטי">
            <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
              <li><Link to="/accessibility" className={linkClass}>הצהרת נגישות</Link></li>
              <li><Link to="/privacy" className={linkClass}>מדיניות פרטיות</Link></li>
              <li>
                <TermsDialog
                  autoOpen={false}
                  trigger={<button type="button" className={linkClass}>תנאי שימוש</button>}
                />
              </li>
            </ul>
          </nav>
          <div className="text-sm text-gray-600">
            Developed by Shulamit
          </div>
          <ContactForm />
        </div>
      </div>
    </footer>
  )
}
