'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Check, Copy, Share2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { ProfileService } from '@/lib/services'

interface SchoolOption {
    id: string
    name: string
    logo: string
    initials: string
}

interface DepartmentOption {
    id: string
    name: string
    faculty_id: string
}

interface InviteLinkPopupProps {
    inviteCode: string
    onClose: () => void
}

function InviteLinkPopup({ inviteCode, onClose }: InviteLinkPopupProps) {
    const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${inviteCode}`
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink)
        toast.success('Link copied to clipboard!')
    }

    const shareLink = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join my class on Qitt',
                    text: 'Use this link to join my class and stay updated with timetables and assignments!',
                    url: inviteLink,
                })
            } catch (err) {
                copyToClipboard()
            }
        } else {
            copyToClipboard()
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-in zoom-in-95">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Your Invite Link</h2>
                        <p className="text-sm text-gray-600 mt-1">Share this link with your classmates</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-2">Invite Code</p>
                    <p className="text-2xl font-bold text-blue-600 tracking-wider">{inviteCode}</p>
                </div>

                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                    <p className="text-xs text-gray-500 mb-2">Invite Link</p>
                    <p className="text-sm text-gray-800 break-all font-mono">{inviteLink}</p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={copyToClipboard}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                    >
                        <Copy className="w-4 h-4" />
                        Copy Link
                    </button>
                    <button
                        onClick={shareLink}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-4 py-3 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                >
                    Continue to Dashboard
                </button>
            </div>
        </div>
    )
}

export function CourseRepRegisterForm({ onRegisterSuccess }: { onRegisterSuccess: () => void }) {
    const { registerCourseRep, loading } = useAuthStore()
    const [schools, setSchools] = useState<SchoolOption[]>([])
    const [departments, setDepartments] = useState<DepartmentOption[]>([])
    const [loadingSchools, setLoadingSchools] = useState(true)
    const [loadingDepartments, setLoadingDepartments] = useState(false)
    const [showInvitePopup, setShowInvitePopup] = useState(false)
    const [generatedInviteCode, setGeneratedInviteCode] = useState('')
    const [data, setData] = useState({
        name: '',
        email: '',
        phone_number: '',
        department_id: '',
        level: '',
        password: '',
    })
    const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    // Fetch schools
    useEffect(() => {
        const fetchSchools = async () => {
            try {
                const schoolsData = await ProfileService.getSchools()
                
                const formattedSchools: SchoolOption[] = schoolsData.map((school) => {
                    const logoMap: Record<string, string> = {
                        'University of Port Harcourt': '/uniport.png',
                        'University of Calabar': '/unical.jpeg'
                    }
                    
                    const logoPath = school.logo_url || logoMap[school.name] || `/schools/${school.name.toLowerCase().replace(/\s+/g, '')}.png`
                    
                    return {
                        id: school.id,
                        name: school.name,
                        logo: logoPath,
                        initials: school.name.substring(0, 1),
                    }
                })
                
                setSchools(formattedSchools)
            } catch (error) {
                console.error('Failed to fetch schools:', error)
                toast.error('Failed to load schools. Please refresh the page.')
            } finally {
                setLoadingSchools(false)
            }
        }

        fetchSchools()
    }, [])

    // Fetch departments when school changes
    useEffect(() => {
        const fetchDepartments = async () => {
            if (!selectedSchool) {
                setDepartments([])
                return
            }

            setLoadingDepartments(true)
            try {
                const depts = await ProfileService.getDepartmentsBySchool(selectedSchool)
                setDepartments(depts.map(d => ({
                    id: d.id,
                    name: d.name,
                    faculty_id: d.faculty_id
                })))
            } catch (error) {
                console.error('Failed to fetch departments:', error)
                setDepartments([])
            } finally {
                setLoadingDepartments(false)
            }
        }

        fetchDepartments()
        // Reset department when school changes
        setData(prev => ({ ...prev, department_id: '' }))
    }, [selectedSchool])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setData(prev => ({ ...prev, [name]: value }))
    }

    // Check if all required fields are filled
    const isFormComplete = () => {
        return (
            data.name.trim() !== '' &&
            data.email.trim() !== '' &&
            data.phone_number.trim() !== '' &&
            selectedSchool !== null &&
            data.department_id !== '' &&
            data.level !== '' &&
            data.password.trim() !== '' &&
            data.password.length >= 6 &&
            agreedToTerms
        )
    }

    const validate = () => {
        if (!data.name.trim()) return toast.error('Full name is required')
        if (!data.email.trim()) return toast.error('Email is required')
        if (!data.phone_number.trim()) return toast.error('Phone number is required')
        if (!selectedSchool) return toast.error('Please select a school')
        if (!data.department_id) return toast.error('Please select a department')
        if (!data.level) return toast.error('Please select a level')
        if (!data.password.trim()) return toast.error('Password is required')
        if (data.password.length < 6) return toast.error('Password must be at least 6 characters')
        if (!agreedToTerms) return toast.error('Please agree to the terms')
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        try {
            // Use new CourseRepRegistrationData format
            const inviteCode = await registerCourseRep(data.email, data.password, {
                name: data.name,
                phone_number: data.phone_number,
                school_id: selectedSchool!,
                department_id: data.department_id,
                level_number: parseInt(data.level),
            })
            
            setGeneratedInviteCode(inviteCode)
            setShowInvitePopup(true)
        } catch {
            // Error already handled by store
        }
    }

    const handlePopupClose = () => {
        setShowInvitePopup(false)
        if (typeof window !== 'undefined') {
            window.location.href = '/dashboard'
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="w-full space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800 font-medium">📚 Course Rep Registration</p>
                    <p className="text-xs text-blue-600 mt-1">You&apos;ll get a unique link to share with your classmates</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="eg John Doe"
                        value={data.name}
                        onChange={handleChange}
                        autoComplete="off"
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50"
                        style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Email</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="john@example.com"
                        value={data.email}
                        onChange={handleChange}
                        autoComplete="off"
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50"
                        style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50"
                        style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Select School</label>
                    <div className="flex gap-2 h-16">
                        {loadingSchools ? (
                            <div className="flex-1 flex items-center justify-center text-gray-500">Loading schools...</div>
                        ) : schools.length > 0 ? (
                            schools.map(school => (
                                <button
                                    key={school.id}
                                    type="button"
                                    onClick={() => setSelectedSchool(school.id)}
                                    disabled={loading || loadingSchools}
                                    className={`flex-1 flex flex-col items-center justify-center gap-1 p-2 border-2 rounded-lg transition-colors overflow-hidden disabled:opacity-50 ${
                                        selectedSchool === school.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <img
                                        src={school.logo}
                                        alt={school.name}
                                        className="w-8 h-8 object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            target.style.display = 'none'
                                        }}
                                    />
                                    <span className="text-xs font-medium text-gray-600 truncate w-full text-center">{school.name.split(' ').slice(-1)[0]}</span>
                                </button>
                            ))
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-500">No schools available</div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Department</label>
                    <div className="relative">
                        <select
                            name="department_id"
                            value={data.department_id}
                            onChange={handleChange}
                            disabled={loading || loadingDepartments || !selectedSchool}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                        >
                            <option value="">
                                {!selectedSchool ? 'Select a school first' : loadingDepartments ? 'Loading departments...' : 'Select Department'}
                            </option>
                            {departments.map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Level</label>
                    <div className="relative">
                        <select
                            name="level"
                            value={data.level}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 appearance-none disabled:opacity-50"
                            style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                        >
                            <option value="">Select Level</option>
                            <option value="1">100 Level</option>
                            <option value="2">200 Level</option>
                            <option value="3">300 Level</option>
                            <option value="4">400 Level</option>
                            <option value="5">500 Level</option>
                            <option value="6">600 Level</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Min 6 characters"
                        value={data.password}
                        onChange={handleChange}
                        autoComplete="new-password"
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50"
                        style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
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
                    disabled={loading || !isFormComplete()}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Creating Account...' : 'Register as Course Rep'}
                </button>
            </form>

            {showInvitePopup && (
                <InviteLinkPopup 
                    inviteCode={generatedInviteCode} 
                    onClose={handlePopupClose} 
                />
            )}
        </>
    )
}
