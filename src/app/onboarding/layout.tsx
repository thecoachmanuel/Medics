'use client'
import { userAuthStore } from '@/store/authStore'
import { redirect } from 'next/navigation';
import Link from 'next/link';
import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

const layout = ({children}:{children:React.ReactNode}) => {
	const {isAuthenticated, user, logout} = userAuthStore();

	useEffect(() => {
		if(!isAuthenticated || !user){
			redirect('/login/patient')
			return;
		}
		if(user.isVerified){
			if(user.type === 'doctor'){
				redirect('/doctor/dashboard')
			}else{
				redirect('/patient/dashboard')
			}
		}
	},[isAuthenticated, user])

	if(!isAuthenticated || !user) return null;
  return (
    <div className='min-h-screen bg-gray-50 flex flex-col'>
        <header className='bg-white border-b px-6 py-4'>
				<div className='max-w-4xl mx-auto flex items-center justify-between'>
					<Link href="/" className='text-2xl font-bold text-blue-900 inline-block'>
					MedicsOnline
					</Link>
					<Button
						variant="ghost"
						size="sm"
						className="text-gray-600 hover:text-red-600 flex items-center gap-2"
						onClick={logout}
					>
						<LogOut className="w-4 h-4" />
						<span>Logout</span>
					</Button>
				</div>
        </header>
        <main className='flex-1 flex items-center justify-center p-6'>
            {children}
        </main>
    </div>
  )
}

export default layout
