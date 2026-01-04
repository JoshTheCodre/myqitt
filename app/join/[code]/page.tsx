'use client'

import { useState, useEffect, use } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, Users, BookOpen, Clock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'

interface CourseRepInfo {
    id: string
    name: string
    school_name: string
    department_name: string
    level: number
    semester: string
}

export default function JoinPage({ params }: { params: Promise<{ code: string }> }) {
    const resolvedParams = use(params)
    const inviteCode = resolvedParams.code
    const router = useRouter()
    const { registerWithInvite, loading } = useAuthStore()
    const [courseRep, setCourseRep] = useState<CourseRepInfo | null>(null)
    const [loadingInfo, setLoadingInfo] = useState(true)
    const [invalidCode, setInvalidCode] = useState(false)
    const [data, setData] = useState({
        name: '',
        phone_number: '',
        password: '',
    })
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    useEffect(() => {
        const fetchCourseRepInfo = async () => {
            try {
                const { data: repData, error } = await supabase
                    .from('users')
                    .select(`
                        id,
                        name,
                        level,
                        semester,
                        schools!inner(name),
                        departments!inner(name)
                    `)
                    .eq('invite_code', inviteCode)
                    .contains('roles', ['course_rep'])
                    .single()

                if (error || !repData) {
                    setInvalidCode(true)
                    return
                }

                setCourseRep({
                    id: repData.id,
                    name: repData.name,
                    school_name: (repData.schools as any)?.name || 'Unknown School',
                    department_name: (repData.departments as any)?.name || 'Unknown Department',
                    level: repData.level,
                    semester: repData.semester,
                })
            } catch (error) {
                console.error('Error fetching course rep info:', error)
                setInvalidCode(true)
            } finally {
                setLoadingInfo(false)
            }
        }

        fetchCourseRepInfo()
    }, [inviteCode])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setData(prev => ({ ...prev, [name]: value }))
    }

    const validate = () => {
        if (!data.name.trim()) return toast.error('Full name is required')
        if (!data.phone_number.trim()) return toast.error('Phone number is required')
        if (!data.password.trim()) return toast.error('Password is required')
        if (data.password.length < 6) return toast.error('Password must be at least 6 characters')
        if (!agreedToTerms) return toast.error('Please agree to the terms')
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        try {
            await registerWithInvite(inviteCode, data.password, {
                name: data.name,
                phone_number: data.phone_number,
            })
        } catch {
            // Error already handled by store
        }
    }

    if (loadingInfo) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading class information...</p>
                </div>
            </div>
        )
    }

    if (invalidCode) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite Link</h1>
                    <p className="text-gray-600 mb-6">This invite link is invalid or has expired. Please ask your course rep for a new link.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center">
                    <Image src="/qitt-logo-white.svg" alt="Qitt" width={60} height={60} className="mx-auto mb-3" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    <h1 className="text-xl font-bold">Join Your Class</h1>
                    <p className="text-blue-100 text-sm mt-1">Connect with your classmates on Qitt</p>
                </div>

                {/* Course Rep Info Card */}
                <div className="px-6 -mt-4">
                    <div className="bg-white border-2 border-blue-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Course Rep</p>
                                <p className="font-semibold text-gray-900">{courseRep?.name}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs text-gray-500">School</p>
                                <p className="font-medium text-gray-800 truncate">{courseRep?.school_name}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs text-gray-500">Department</p>
                                <p className="font-medium text-gray-800 truncate">{courseRep?.department_name}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs text-gray-500">Level</p>
                                <p className="font-medium text-gray-800">{courseRep?.level} Level</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs text-gray-500">Semester</p>
                                <p className="font-medium text-gray-800 capitalize">{courseRep?.semester} Semester</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="px-6 py-4">
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span>Timetable</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-green-500" />
                            <span>Assignments</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span>Updates</span>
                        </div>
                    </div>
                </div>

                {/* Registration Form */}
                <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={data.name}
                            onChange={handleChange}
                            autoComplete="off"
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            name="phone_number"
                            placeholder="+234 800 123 4567"
                            value={data.phone_number}
                            onChange={handleChange}
                            autoComplete="off"
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-800 mb-2">Create Password</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Min 6 characters"
                            value={data.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50"
                        />
                    </div>

                    <div className="flex items-start gap-2">
                        <button
                            type="button"
                            onClick={() => setAgreedToTerms(!agreedToTerms)}
                            disabled={loading}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-50 ${
                                agreedToTerms ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                            }`}
                        >
                            {agreedToTerms && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <label className="text-sm text-gray-600">
                            I agree to the <a href="#" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating Account...' : 'Join Class'}
                    </button>

                    <p className="text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => router.push('/')}
                            className="text-blue-600 hover:underline font-medium"
                        >
                            Login
                        </button>
                    </p>
                </form>
            </div>
        </div>
    )
}
