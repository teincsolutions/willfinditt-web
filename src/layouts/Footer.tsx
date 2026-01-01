import Link from 'next/link';

export const Footer = () => {
  return (
    <footer className="bg-background border-t border-border-custom py-12 text-text">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold text-text">Willfind8</span>
            </Link>
            <p className="text-text-gray text-sm leading-relaxed">
              Find everything you need in one place. The most trusted classifieds platform in Ghana.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text mb-6">Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/about" className="text-text-gray hover:text-primary text-sm transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-text-gray hover:text-primary text-sm transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-text-gray hover:text-primary text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text mb-6">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/help" className="text-text-gray hover:text-primary text-sm transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-text-gray hover:text-primary text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-text mb-6">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-background-primary rounded-full flex items-center justify-center text-text-gray hover:text-primary hover:bg-primary/10 transition-all">
                FB
              </a>
              <a href="#" className="w-10 h-10 bg-background-primary rounded-full flex items-center justify-center text-text-gray hover:text-primary hover:bg-primary/10 transition-all">
                TW
              </a>
              <a href="#" className="w-10 h-10 bg-background-primary rounded-full flex items-center justify-center text-text-gray hover:text-primary hover:bg-primary/10 transition-all">
                IG
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border-custom text-center">
          <p className="text-text-light-gray text-xs">
            &copy; {new Date().getFullYear()} Willfind8. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
