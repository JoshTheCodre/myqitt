'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AppShell } from '@/components/layout/app-shell'
import { EditProfileModal } from '@/components/edit-profile-modal'
import { useAuthStore } from '@/lib/store/authStore'
import { Mail, Phone, GraduationCap, Building2, BookOpen, Calendar, LogOut, Edit } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { formatDepartmentName } from '@/lib/hooks/useDepartments'

// ============ PROFILE CARD COMPONENT ============
function ProfileCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string | number | null | undefined }) {
    return (
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-sm font-semibold text-gray-900 truncate">{value || 'Not set'}</p>
            </div>
        </div>
    )
}

// Map school IDs to names
function getSchoolName(schoolId: string | undefined) {
    if (!schoolId) return 'Not set'
    const schoolMap: Record<string, string> = {
        '6c59c8d9-b5d3-4525-b5bd-4ad38ef65e57': 'University of Port Harcourt',
        '426a9fce-3d64-4679-8178-5d0776990d4a': 'Rivers State University'
    }
    return schoolMap[schoolId] || schoolId
}

export default function ProfilePage() {
    const { user, profile, logout } = useAuthStore()
    const router = useRouter()
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const handleLogout = async () => {
        try {
            await logout()
            // Redirect is handled by the logout action
        } catch (error) {
            console.error('Logout error:', error)
        }
    }

    if (!user || !profile) {
        return (
            <AppShell>
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </AppShell>
        )
    }

    // Get initials for avatar
    const initials = profile?.name
        ?.split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U'

    return (
        <AppShell>
            <div className="h-full flex items-start justify-center">
                <div className="w-full max-w-2xl px-4 py-8 pb-24 lg:pb-8">
                    {/* Header with Avatar */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg mb-6">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                                {profile?.avatar_url ? (
                                    <Image 
                                        src={profile.avatar_url} 
                                        alt={profile.name || 'User'} 
                                        width={96}
                                        height={96}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span>{initials}</span>
                                )}
                            </div>
                            <h1 className="text-2xl font-bold mb-1">{profile?.name || 'User'}</h1>
                            <p className="text-blue-100 text-sm">{profile?.email}</p>
                            {profile?.level && profile?.semester && (
                                <div className="mt-3 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium">
                                    {profile.level}00 Level • {profile.semester === 'first' ? 'First' : 'Second'} Semester
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="space-y-3 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 px-1">Profile Information</h2>
                        
                        <ProfileCard icon={Mail} label="Email Address" value={profile?.email} />
                        <ProfileCard icon={Phone} label="Phone Number" value={profile?.phone_number} />
                        <ProfileCard icon={Building2} label="School" value={getSchoolName(profile?.school)} />
                        <ProfileCard icon={GraduationCap} label="Department" value={profile?.department ? formatDepartmentName(profile.department) : 'Not set'} />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <ProfileCard icon={BookOpen} label="Level" value={profile?.level ? `${profile.level}00 Level` : undefined} />
                            <ProfileCard icon={Calendar} label="Semester" value={profile?.semester ? (profile.semester === 'first' ? 'First' : 'Second') : undefined} />
                        </div>
                    </div>

                    {/* Bio */}
                    {profile?.bio && (
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900 px-1 mb-3">About</h2>
                            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                            <p className="text-2xl font-bold text-purple-600">0</p>
                            <p className="text-xs text-purple-700 font-medium">Followers</p>
                        </div>
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                            <p className="text-2xl font-bold text-green-600">0</p>
                            <p className="text-xs text-green-700 font-medium">Roles</p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <button
                            className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            onClick={() => setIsEditModalOpen(true)}
                        >
                            <Edit className="w-5 h-5" />
                            Edit Profile
                        </button>
                        
                        <button
                            className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-2 border border-red-200"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
            </div>
            <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
        </AppShell>
    )
}
