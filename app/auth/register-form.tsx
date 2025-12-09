'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/authStore'
import { supabase } from '@/lib/supabase/client'
import { useDepartments, formatDepartmentName } from '@/lib/hooks/useDepartments'

interface SchoolOption {
    id: string
    name: string
    logo: string
    initials: string
}

export function RegisterForm({ onRegisterSuccess }: { onRegisterSuccess: () => void }) {
    const { register } = useAuthStore()
    const [schools, setSchools] = useState<SchoolOption[]>([])
    const [loadingSchools, setLoadingSchools] = useState(true)
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({
        name: '',
        email: '',
        phone_number: '',
        department: '',
        level: '',
        semester: '',
        password: '',
    })
    const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
    const [agreedToTerms, setAgreedToTerms] = useState(false)
    
    // Fetch departments based on selected school
    const { departments, loading: loadingDepartments } = useDepartments(selectedSchool)

    useEffect(() => {
        const fetchSchools = async () => {
            try {
                // Check if schools are cached in localStorage
                const cachedSchools = localStorage.getItem('schools_cache')
                const cacheTimestamp = localStorage.getItem('schools_cache_timestamp')
                const now = Date.now()
                const ONE_HOUR = 60 * 60 * 1000

                // Use cache if it's less than 1 hour old
                if (cachedSchools && cacheTimestamp && (now - parseInt(cacheTimestamp)) < ONE_HOUR) {
                    const formattedSchools: SchoolOption[] = JSON.parse(cachedSchools)
                    setSchools(formattedSchools)
                    setLoadingSchools(false)
                    return
                }

                const { data: schoolsData, error } = await supabase
                    .from('schools')
                    .select('id, name')
                
                if (error) throw error
                
                const formattedSchools: SchoolOption[] = schoolsData.map((school: { id: string; name: string }) => ({
                    id: school.id,
                    name: school.name,
                    logo: `/schools/${school.name.toLowerCase()}.png`,
                    initials: school.name.substring(0, 1),
                }))
                
                // Cache the schools data
                localStorage.setItem('schools_cache', JSON.stringify(formattedSchools))
                localStorage.setItem('schools_cache_timestamp', now.toString())
                
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setData(prev => ({ ...prev, [name]: value }))
    }

    const validate = () => {
        if (!data.name.trim()) return toast.error('Full name is required')
        if (!data.email.trim()) return toast.error('Email is required')
        if (!data.phone_number.trim()) return toast.error('Phone number is required')
        if (!selectedSchool) return toast.error('Please select a school')
        if (!data.department) return toast.error('Please select a department')
        if (!data.level) return toast.error('Please select a level')
        if (!data.semester) return toast.error('Please select a semester')
        if (!data.password.trim()) return toast.error('Password is required')
        if (data.password.length < 6) return toast.error('Password must be at least 6 characters')
        if (!agreedToTerms) return toast.error('Please agree to the terms')
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return

        setLoading(true)
        try {
            // Convert semester from "1"/"2" to "first"/"second"
            const semesterMap: { [key: string]: string } = {
                '1': 'first',
                '2': 'second'
            }

            await register(data.email, data.password, {
                name: data.name,
                email: data.email,
                phone_number: data.phone_number,
                school: selectedSchool!,
                department: data.department,
                level: parseInt(data.level),
                semester: semesterMap[data.semester],
            })
            setData({ name: '', email: '', phone_number: '', department: '', level: '', semester: '', password: '' })
            setSelectedSchool(null)
            setAgreedToTerms(false)
            // Redirect is handled by the register action
        } catch {
            // Error already handled by store
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Full Name</label>
                <input
                    type="text"
                    name="name"
                    placeholder="eg Zewaen"
                    value={data.name}
                    onChange={handleChange}
                    autoComplete="off"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Select School</label>
                <div className="flex gap-2 h-12">
                    {loadingSchools ? (
                        <div className="flex-1 flex items-center justify-center text-gray-500">Loading schools...</div>
                    ) : schools.length > 0 ? (
                        schools.map(school => (
                            <button
                                key={school.id}
                                type="button"
                                onClick={() => setSelectedSchool(school.id)}
                                disabled={loading || loadingSchools}
                                className={`flex-1 flex items-center justify-center gap-2 border-2 rounded-lg transition-colors overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${selectedSchool === school.id ? 'border-2' : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                style={selectedSchool === school.id ? { borderColor: '#4045EF', backgroundColor: '#f0f4ff' } : {}}
                            >
                                <span className="text-xs font-semibold text-gray-700">{school.name}</span>
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
                        name="department"
                        value={data.department}
                        onChange={handleChange}
                        disabled={loading || loadingDepartments || !selectedSchool}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                    >
                        <option value="">
                            {!selectedSchool ? 'Select a school first' : loadingDepartments ? 'Loading departments...' : departments.length === 0 ? 'No departments available' : 'Select Department'}
                        </option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.department}>
                                {formatDepartmentName(dept.department)}
                            </option>
                        ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-4 text-gray-600 pointer-events-none" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Level</label>
                    <div className="relative">
                        <select
                            name="level"
                            value={data.level}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                        >
                            <option value="">Select Level</option>
                            <option value="1">Level 1</option>
                            <option value="2">Level 2</option>
                            <option value="3">Level 3</option>
                            <option value="4">Level 4</option>
                            <option value="5">Level 5</option>
                            <option value="6">Level 6</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-4 text-gray-600 pointer-events-none" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-800 mb-2">Semester</label>
                    <div className="relative">
                        <select
                            name="semester"
                            value={data.semester}
                            onChange={handleChange}
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                        >
                            <option value="">Select Semester</option>
                            <option value="1">First Semester</option>
                            <option value="2">Second Semester</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-4 text-gray-600 pointer-events-none" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Password</label>
                <input
                    type="password"
                    name="password"
                    placeholder="Password123"
                    value={data.password}
                    onChange={handleChange}
                    autoComplete="off"
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent placeholder:text-gray-400 bg-white text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                />
            </div>

            <div className="flex items-center gap-3 mt-6 mb-8">
                <button
                    type="button"
                    onClick={() => setAgreedToTerms(!agreedToTerms)}
                    disabled={loading}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${agreedToTerms ? 'border-2' : 'border-gray-300 hover:border-gray-400'
                        }`}
                    style={agreedToTerms ? { backgroundColor: '#4045EF', borderColor: '#4045EF' } : {}}
                >
                    {agreedToTerms && <Check size={16} className="text-white" />}
                </button>
                <span className="text-sm text-gray-700">
                    I agree to{' '}
                    <a href="#" className="hover:underline font-semibold" style={{ color: '#4045EF' }}>
                        Term & Condition
                    </a>
                </span>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-semibold py-3 px-4 rounded-xl transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#4045EF' }}
            >
                {loading ? 'Creating account...' : 'Sign up'}
            </button>
        </form>
    )
}
