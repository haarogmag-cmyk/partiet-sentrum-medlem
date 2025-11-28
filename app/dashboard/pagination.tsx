'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface PaginationProps {
    currentPage: number
    totalPages: number
    // searchParams kan være en Promise, men her får vi den som en ren JS-objekt fra Server Component
    searchParams: { [key: string]: string | string[] | undefined }
}

export default function Pagination({ currentPage, totalPages, searchParams }: PaginationProps) {
    const pathname = usePathname()
    
    if (totalPages <= 1) return null

    // Funksjon for å bygge URL-strengen med alle eksisterende søkeparametere
    const createPageURL = (page: number) => {
        const params = new URLSearchParams()
        
        // Kopierer alle eksisterende søkeparametere (q, fylke, tab)
        for (const [key, value] of Object.entries(searchParams)) {
            if (value !== undefined) {
                // Håndterer både enkeltstreng og array
                if (Array.isArray(value)) {
                    value.forEach(v => params.append(key, v));
                } else if (key !== 'page') {
                    params.set(key, value);
                }
            }
        }
        
        // Legg til den nye side-parameteren
        params.set('page', page.toString())
        return `${pathname}?${params.toString()}`
    }

    const isFirstPage = currentPage === 1
    const isLastPage = currentPage === totalPages

    return (
        <div className="flex justify-between items-center py-4 text-sm font-medium">
            <Link 
                href={createPageURL(currentPage - 1)}
                scroll={false}
                className={`px-4 py-2 rounded-lg transition-colors ${
                    isFirstPage 
                        ? 'text-slate-400 bg-slate-50 cursor-not-allowed' 
                        : 'text-[#5e1639] hover:bg-[#fffcf1] border border-[#c93960]/30'
                }`}
                aria-disabled={isFirstPage}
                tabIndex={isFirstPage ? -1 : undefined}
            >
                ← Forrige side
            </Link>

            <span className="text-[#5e1639] opacity-70">
                Side {currentPage} av {totalPages}
            </span>

            <Link 
                href={createPageURL(currentPage + 1)}
                scroll={false}
                className={`px-4 py-2 rounded-lg transition-colors ${
                    isLastPage 
                        ? 'text-slate-400 bg-slate-50 cursor-not-allowed' 
                        : 'text-[#5e1639] hover:bg-[#fffcf1] border border-[#c93960]/30'
                }`}
                aria-disabled={isLastPage}
                tabIndex={isLastPage ? -1 : undefined}
            >
                Neste side →
            </Link>
        </div>
    )
}