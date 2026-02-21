'use client'
import { userAuthStore } from "@/store/authStore";
import { useEffect } from "react";



export function Providers({children} : {children:React.ReactNode}) {
    const {fetchProfile} =  userAuthStore();
    useEffect(() => {
        fetchProfile();
    },[fetchProfile]);

    return <>{children}</>
}
