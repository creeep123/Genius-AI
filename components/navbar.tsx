import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/nextjs';
import MobileSidebar from '@/components/mobile-sidebar';
import { getApiLimitCount } from '@/lib/api_limit';

const Navbar = async () => {
  const apiLimitCount = await getApiLimitCount();

  return (
    <div className="flex items-center p-4">
      <MobileSidebar
        apiLimitCount={apiLimitCount}
      />
      <div className="flex w-full justify-end">
        <UserButton afterSignOutUrl='/'></UserButton>
      </div>
    </div>
  );
};

export default Navbar;
