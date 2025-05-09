'use client'

import React from 'react'
import {
    Sheet, SheetClose, SheetContent,SheetTrigger,} from "@/components/ui/sheet"
import Link from 'next/link'
import Image from 'next/image'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { navLinks } from '@/constants'
import { usePathname } from 'next/navigation'
import { Button } from '../ui/button'

const MobileNav = () => {
    
    const pathname = usePathname();

  return (
     <header className='header'>
        <Link href="/" className="flex items-center gap-2 md:py-2">
            <Image src="/assets/images/mano-texto-sem-fundo.png" alt="logo" width={130} height={28} />
        </Link>
        <nav className="flex gap-2">
            <SignedIn>
                <UserButton afterSignOutUrl='/'/>
                <Sheet>
                <SheetTrigger>
                    <Image src="/assets/icons/icons8-menu.svg" alt="menu" width={32} height={32} className='cursor-pointer'
                     />
                </SheetTrigger>
                    <SheetContent className='sheet-content sm:w-64'>
                      <>
                        <Image src="/assets/images/mano-texto-sem-fundo.png" alt="logo" width={152} height={23} />
                        <ul className='header-nav_elements'>
                        {navLinks.map((link) =>{
                            const isActive = link.route === pathname

                            return(
                                <li key={link.route} className={`${isActive && 'gradient-text'} p-18 flex whitespace-nowrap text-gray-menu`}>
                                    <SheetClose asChild>
                                    <Link className={`sidebar-link cursor-pointer  ${isActive && 'text-black-menu'}`} href={link.route}>
                                        {link.label}
                                        </Link>
                                    </SheetClose>
                                </li>
                            )
                        })}
                        </ul>
                      </>
                    </SheetContent>
                </Sheet>

            </SignedIn>
            <SignedOut>
                    <Button asChild className=''>
                        <Link href="/sign-in">Login</Link>
                    </Button>
                </SignedOut>
        </nav>
     </header>
  )
}

export default MobileNav