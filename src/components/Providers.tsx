'use client'
import { userAuthStore } from "@/store/authStore";
import { useEffect } from "react";
import { Toaster } from "sonner";

export function Providers({children} : {children:React.ReactNode}) {
    const {fetchProfile} =  userAuthStore();
    useEffect(() => {
        fetchProfile();
    },[fetchProfile]);

    return (
        <>
            {children}
            <Toaster position="top-center" richColors />
        </>
    )
}
