'use client'

import { useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/lib/store/authStore'

interface SchoolOption {
    id: string
    name: string
    logo: string
    initials: string
}

const schools: SchoolOption[] = [
    { id: 'uniport', name: 'Uniport', logo: '/uniport.png', initials: 'U' },
    { id: 'rsu', name: 'RSU', logo: '/rsu.jpeg', initials: 'R' },
]

export function RegisterForm({ onRegisterSuccess }: { onRegisterSuccess: () => void }) {
    const { register, loading } = useAuthStore()
    const [data, setData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        department: '',
        level: '',
        semester: '',
        password: '',
    })
    const [selectedSchool, setSelectedSchool] = useState<string | null>(null)
    const [agreedToTerms, setAgreedToTerms] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setData(prev => ({ ...prev, [name]: value }))
    }

    const validate = () => {
        if (!data.fullName.trim()) return toast.error('Full name is required')
        if (!data.email.trim()) return toast.error('Email is required')
        if (!data.phoneNumber.trim()) return toast.error('Phone number is required')
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

        try {
            await register(data.email, data.password, {
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber,
                school: selectedSchool!,
                department: data.department,
                level: data.level,
                semester: data.semester,
            })
            setData({ fullName: '', email: '', phoneNumber: '', department: '', level: '', semester: '', password: '' })
            setSelectedSchool(null)
            setAgreedToTerms(false)
            onRegisterSuccess()
        } catch (err) {
            // Error already handled by store
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Full Name</label>
                <input
                    type="text"
                    name="fullName"
                    placeholder="eg Zewaen"
                    value={data.fullName}
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
                    name="phoneNumber"
                    placeholder="+234 800 123 4567"
                    value={data.phoneNumber}
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
                    {schools.map(school => (
                        <button
                            key={school.id}
                            type="button"
                            onClick={() => setSelectedSchool(school.id)}
                            disabled={loading}
                            className={`flex-1 flex items-center justify-center gap-2 border-2 rounded-lg transition-colors overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed ${selectedSchool === school.id ? 'border-2' : 'border-gray-200 hover:border-gray-300'
                                }`}
                            style={selectedSchool === school.id ? { borderColor: '#4045EF', backgroundColor: '#f0f4ff' } : {}}
                        >
                            <div className="relative w-5 h-5">
                                <Image src={school.logo} alt={school.name} fill className="object-cover rounded" />
                            </div>
                            <span className="text-xs font-semibold text-gray-700">{school.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">Department</label>
                <div className="relative">
                    <select
                        name="department"
                        value={data.department}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent appearance-none bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ '--tw-ring-color': '#4045EF' } as React.CSSProperties}
                    >
                        <option value="">Select Department</option>
                        <option value="cs">Computer Science</option>
                        <option value="eng">Engineering</option>
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
                            <option value="100">100</option>
                            <option value="200">200</option>
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
