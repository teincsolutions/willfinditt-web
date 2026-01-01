import Link from 'next/link';
import { Button } from '@/components/Button';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <div className="w-24 h-24 bg-background-primary rounded-full flex items-center justify-center mb-6 text-4xl shadow-sm">
        🔍
      </div>
      <h1 className="text-4xl font-bold text-text mb-2">Page Not Found</h1>
      <p className="text-text-gray mb-8 max-w-md">
        Sorry, we couldn't find the page you're looking for. It might have been removed or doesn't exist.
      </p>
      <div className="flex gap-4">
        <Link href="/">
          <Button size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
