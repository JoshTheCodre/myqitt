'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { HeadsetIcon, BookIcon, Users, ArrowRight } from 'lucide-react'
import { useAuthStore, UserProfile } from '@/lib/store/authStore'
import { AppShell } from '@/components/layout/app-shell'
import { CatchUpModal } from '@/components/catch-up-modal'

// ============ HELPER FUNCTIONS ============
const getInitials = (name?: string) => {
  if (!name) return 'QZ'
  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return parts[0].substring(0, 2).toUpperCase()
}

// ============ HEADER COMPONENT ============
function Header({ profile }: { profile: UserProfile | null }) {
  return (
    <div className="flex items-start justify-between ">
      <div>
        <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Hello, {profile?.name || 'Guest'}</h1>
        <p className="text-xs font-semibold text-gray-700 mt-1 md:mt-2">{(profile?.department || 'CSC').toUpperCase()} <span className="text-green-500">•</span> {profile?.level ? `${profile.level}00 Level` : 'N/A'}</p>
      </div>
      <div className="flex items-center gap-3">
        <button 
          className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center hover:bg-blue-100 transition-colors cursor-pointer"
          onClick={() => {
            const message = encodeURIComponent('Hi, the issue I&apos;m facing: ')
            window.open(`https://wa.me/2349034954069?text=${message}`, '_blank')
          }}
        >
          <HeadsetIcon className="w-6 h-6 text-blue-600" />
        </button>
        <Link href="/profile">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-colors cursor-pointer">
            <span className="text-white font-bold text-lg">{getInitials(profile?.name)}</span>
          </div>
        </Link>
      </div>
    </div>
  )
}

// ============ CATCH UP SECTION ============
function CatchUpSection({ onItemClick }: { onItemClick: (item: string) => void }) {
  const items = [
    'School Calendar',
    'Year 1 Clearance Checklist',
    'Do your Course Reg Here',
  ]

  return (
    <section>
      <div className="relative rounded-2xl p-4 md:p-8 border border-purple-100 overflow-hidden">
        <Image src="/catchup-bg.png" alt="" fill className="object-cover opacity-20" loading="eager" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw" />
        <div className="relative z-10">
          <ul className="space-y-3 md:space-y-5">
            {items.map((item, index) => (
              <li 
                key={index} 
                className="flex items-center gap-3 md:gap-4 cursor-pointer group"
                onClick={() => onItemClick(item)}
              >
                <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 transition-colors">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />
                </div>
                <div className='flex items-center group-hover:text-blue-600 transition-colors'>
                  <span className="text-md md:text-lg flex items-center gap-3">{item} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// ============ ACTION CARDS COMPONENT ============
function ActionCards() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6">
      <Link href="/courses">
        <div className="relative rounded-xl md:rounded-2xl p-3 md:p-8 text-white cursor-pointer hover:shadow-lg transition-shadow overflow-hidden h-36 md:h-auto">
          <Image src="/courses-card-bg.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(to bottom right, rgba(10, 50, 248, 0.85), rgba(8, 40, 201, 0.85))' }} />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="bg-[#001A0D36] rounded-full p-1.5 md:p-2 w-fit">
              <BookIcon className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold">Courses</h3>
              <p className="text-white/90 mt-0.5 md:mt-2 text-xs md:text-base">View All Courses</p>
            </div>
          </div>
        </div>
      </Link>

      <Link href="/classmates">
        <div className="relative rounded-xl md:rounded-2xl p-4 md:p-8 text-white cursor-pointer hover:shadow-lg transition-shadow overflow-hidden h-36 md:h-auto">
          <Image src="/classmates-card-bg.png" alt="" fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
          <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(to bottom right, rgba(70, 210, 143, 0.85), rgba(58, 185, 121, 0.85))' }} />
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="bg-[#001A0D36] rounded-full p-1.5 md:p-2 w-fit">
              <Users className="w-4 h-4 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold">Classmates</h3>
              <p className="text-white/90 mt-0.5 md:mt-2 text-xs md:text-base">Connect With Peers</p>
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

// ============ TODAY'S CLASSES COMPONENT ============
function TodaysClasses() {
  const classes = [
    {
      id: 1,
      code: 'CSC 215',
      program: 'CS 2',
      time: '9:00 AM - 12:00 PM',
      status: 'Upcoming',
      borderColor: 'border-l-blue-500',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-600',
      dot: 'bg-blue-600',
    },
    {
      id: 2,
      code: 'CSC 345',
      program: 'MBA 2',
      time: '2:00 PM - 5:00 PM',
      status: 'Ongoing',
      borderColor: 'border-l-amber-400',
      badgeBg: 'bg-amber-50',
      badgeText: 'text-amber-400',
      dot: 'bg-amber-400',
    },
  ]

  return (
    <section>
      <h2 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">Today&apos;s Classes</h2>
      <div className="space-y-2 md:space-y-4">
        {classes.map((cls) => (
          <div
            key={cls.id}
            className={`border-l-4 ${cls.borderColor} bg-white rounded-lg md:rounded-xl p-5 md:p-6 border-r border-t border-b border-gray-200`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg  md:text-xl font-bold">{cls.code}</h3>
                <p className="text-muted-foreground text-xs md:text-sm">{cls.program}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-semibold mb-1 md:mb-3 text-sm">{cls.time}</p>
                <div className={`${cls.badgeBg} ${cls.badgeText} rounded-full px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-medium inline-flex items-center gap-1.5 md:gap-2`}>
                  <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${cls.dot || cls.badgeText}`}></span>
                  <span className="hidden sm:inline">{cls.status}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ============ MAIN PAGE COMPONENT ============
export default function Page() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const { profile } = useAuthStore()

  const handleItemClick = (item: string) => {
    setSelectedItem(item)
    setModalOpen(true)
  }

  return (
    <AppShell>
      <div className="h-full flex items-start justify-center">
        <div className="w-full max-w-2xl px-3 md:px-4 py-4 md:py-8 pb-24 lg:pb-8">
          <Header profile={profile} />
          <div className="mt-5 md:mt-12">
            <CatchUpSection onItemClick={handleItemClick} />
          </div>
          <div className="mt-5 md:mt-8">
            <ActionCards />
          </div>
          <div className="mt-5 md:mt-12">
            <TodaysClasses />
          </div>
        </div>
      </div>
      <CatchUpModal
        isOpen={modalOpen}
        item={selectedItem}
        onClose={() => {
          setModalOpen(false)
          setSelectedItem(null)
        }}
      />
    </AppShell>
  )
}
